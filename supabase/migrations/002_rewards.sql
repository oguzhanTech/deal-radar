-- Phase 4: Reward System
-- Add points, level, badges to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS badges jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add trending_awarded flag to deals (one-time trending bonus)
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS trending_awarded boolean NOT NULL DEFAULT false;

-- Function: compute level from points
CREATE OR REPLACE FUNCTION compute_level(pts integer)
RETURNS integer LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF pts >= 1000 THEN RETURN 5;
  ELSIF pts >= 400 THEN RETURN 4;
  ELSIF pts >= 150 THEN RETURN 3;
  ELSIF pts >= 50 THEN RETURN 2;
  ELSE RETURN 1;
  END IF;
END;
$$;

-- Function: award points to a user and update level
CREATE OR REPLACE FUNCTION award_points(target_user_id uuid, amount integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_points integer;
  new_level integer;
BEGIN
  UPDATE public.profiles
    SET points = points + amount
    WHERE user_id = target_user_id
    RETURNING points INTO new_points;

  new_level := compute_level(new_points);

  UPDATE public.profiles
    SET level = new_level
    WHERE user_id = target_user_id AND level != new_level;
END;
$$;

-- Function: check and award badges
CREATE OR REPLACE FUNCTION check_badges(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  p_record record;
  approved_count integer;
  trending_count integer;
  comment_count integer;
  current_badges jsonb;
  new_badges jsonb;
  newly_awarded text[] := ARRAY[]::text[];
BEGIN
  SELECT * INTO p_record FROM public.profiles WHERE user_id = target_user_id;
  IF NOT FOUND THEN RETURN; END IF;

  current_badges := p_record.badges;
  new_badges := current_badges;

  SELECT count(*) INTO approved_count
    FROM public.deals WHERE created_by = target_user_id AND status = 'approved';

  SELECT count(*) INTO trending_count
    FROM public.deals WHERE created_by = target_user_id AND trending_awarded = true;

  SELECT count(*) INTO comment_count
    FROM public.deal_comments WHERE user_id = target_user_id;

  -- early_hunter: first approved deal
  IF approved_count >= 1 AND NOT current_badges @> '"early_hunter"'::jsonb THEN
    new_badges := new_badges || '"early_hunter"'::jsonb;
    newly_awarded := array_append(newly_awarded, 'early_hunter');
  END IF;

  -- trending_hunter: first deal reaches trending
  IF trending_count >= 1 AND NOT current_badges @> '"trending_hunter"'::jsonb THEN
    new_badges := new_badges || '"trending_hunter"'::jsonb;
    newly_awarded := array_append(newly_awarded, 'trending_hunter');
  END IF;

  -- community_builder: 10+ approved deals
  IF approved_count >= 10 AND NOT current_badges @> '"community_builder"'::jsonb THEN
    new_badges := new_badges || '"community_builder"'::jsonb;
    newly_awarded := array_append(newly_awarded, 'community_builder');
  END IF;

  -- trusted_submitter: level >= 3 AND 3+ approved deals
  IF p_record.level >= 3 AND approved_count >= 3 AND NOT current_badges @> '"trusted_submitter"'::jsonb THEN
    new_badges := new_badges || '"trusted_submitter"'::jsonb;
    newly_awarded := array_append(newly_awarded, 'trusted_submitter');
  END IF;

  -- first_commenter: first comment created
  IF comment_count >= 1 AND NOT current_badges @> '"first_commenter"'::jsonb THEN
    new_badges := new_badges || '"first_commenter"'::jsonb;
    newly_awarded := array_append(newly_awarded, 'first_commenter');
  END IF;

  -- conversation_starter: 10+ comments
  IF comment_count >= 10 AND NOT current_badges @> '"conversation_starter"'::jsonb THEN
    new_badges := new_badges || '"conversation_starter"'::jsonb;
    newly_awarded := array_append(newly_awarded, 'conversation_starter');
  END IF;

  -- first_share: first approved shared deal
  IF approved_count >= 1 AND NOT current_badges @> '"first_share"'::jsonb THEN
    new_badges := new_badges || '"first_share"'::jsonb;
    newly_awarded := array_append(newly_awarded, 'first_share');
  END IF;

  -- active_submitter: 5+ approved shared deals
  IF approved_count >= 5 AND NOT current_badges @> '"active_submitter"'::jsonb THEN
    new_badges := new_badges || '"active_submitter"'::jsonb;
    newly_awarded := array_append(newly_awarded, 'active_submitter');
  END IF;

  -- community_master: 20+ approved deals and 25+ comments
  IF approved_count >= 20 AND comment_count >= 25 AND NOT current_badges @> '"community_master"'::jsonb THEN
    new_badges := new_badges || '"community_master"'::jsonb;
    newly_awarded := array_append(newly_awarded, 'community_master');
  END IF;

  IF new_badges != current_badges THEN
    UPDATE public.profiles SET badges = new_badges WHERE user_id = target_user_id;

    INSERT INTO public.notifications (user_id, type, title, message, payload)
    SELECT
      target_user_id,
      'badge',
      'Yeni rozet kazanıldı!',
      'Tebrikler, yeni bir rozet eklendi.',
      jsonb_build_object('badge_id', badge_id)
    FROM unnest(newly_awarded) AS badge_id;
  END IF;
END;
$$;

-- Trigger: evaluate comment-related badges on new comment
CREATE OR REPLACE FUNCTION on_deal_comment_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM check_badges(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deal_comment_badges ON public.deal_comments;
CREATE TRIGGER trg_deal_comment_badges
AFTER INSERT ON public.deal_comments
FOR EACH ROW EXECUTE FUNCTION on_deal_comment_insert();

-- Update on_deal_save_change to also award points
CREATE OR REPLACE FUNCTION on_deal_save_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  deal_owner uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT created_by INTO deal_owner FROM public.deals WHERE id = NEW.deal_id;
    IF deal_owner IS NOT NULL AND deal_owner != NEW.user_id THEN
      -- Update trust_score
      UPDATE public.profiles SET trust_score = trust_score + 1 WHERE user_id = deal_owner;
      -- Award points to deal owner
      PERFORM award_points(deal_owner, 2);
      PERFORM check_badges(deal_owner);
    END IF;
    PERFORM recalculate_heat_score(NEW.deal_id);
  ELSIF TG_OP = 'DELETE' THEN
    SELECT created_by INTO deal_owner FROM public.deals WHERE id = OLD.deal_id;
    IF deal_owner IS NOT NULL AND deal_owner != OLD.user_id THEN
      UPDATE public.profiles SET trust_score = greatest(trust_score - 1, 0) WHERE user_id = deal_owner;
    END IF;
    PERFORM recalculate_heat_score(OLD.deal_id);
  END IF;
  RETURN NULL;
END;
$$;

-- Update on_deal_vote_change to award points
CREATE OR REPLACE FUNCTION on_deal_vote_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  deal_owner uuid;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT created_by INTO deal_owner FROM public.deals WHERE id = NEW.deal_id;
    IF TG_OP = 'INSERT' AND NEW.vote = 1 AND deal_owner IS NOT NULL AND deal_owner != NEW.user_id THEN
      PERFORM award_points(deal_owner, 1);
    END IF;
    PERFORM recalculate_heat_score(NEW.deal_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM recalculate_heat_score(OLD.deal_id);
  END IF;
  RETURN NULL;
END;
$$;

-- Update heat score to include time decay and trending bonus
CREATE OR REPLACE FUNCTION recalculate_heat_score(target_deal_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  saves_count integer;
  net_votes integer;
  views integer;
  new_score numeric;
  deal_record record;
  deal_owner uuid;
BEGIN
  SELECT * INTO deal_record FROM public.deals WHERE id = target_deal_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT count(*) INTO saves_count FROM public.deal_saves WHERE deal_id = target_deal_id;
  SELECT coalesce(sum(vote), 0) INTO net_votes FROM public.deal_votes WHERE deal_id = target_deal_id;

  new_score := (saves_count * 3) + (greatest(net_votes, 0) * 2) + (coalesce(deal_record.view_count, 0) * 0.1)
    - EXTRACT(EPOCH FROM (now() - deal_record.created_at)) / 86400.0;

  UPDATE public.deals SET heat_score = greatest(new_score, 0) WHERE id = target_deal_id;

  -- Check for trending threshold and award bonus
  IF new_score >= 50 AND NOT deal_record.trending_awarded THEN
    UPDATE public.deals SET trending_awarded = true WHERE id = target_deal_id;
    SELECT created_by INTO deal_owner FROM public.deals WHERE id = target_deal_id;
    IF deal_owner IS NOT NULL THEN
      PERFORM award_points(deal_owner, 25);
      PERFORM check_badges(deal_owner);
    END IF;
  END IF;
END;
$$;
