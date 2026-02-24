-- ============================================================
-- DealRadar Seed Data
-- Run this AFTER the migration, with a service-role or admin connection.
-- created_by must reference an existing auth.users row.
-- For demo purposes, replace the UUID below with an actual user_id after signup.
-- ============================================================

-- Helper: insert deals with a placeholder user id.
-- After your first signup, run:
--   UPDATE deals SET created_by = '<your-user-id>' WHERE created_by = '00000000-0000-0000-0000-000000000000';

INSERT INTO public.deals (title, description, provider, category, country, start_at, end_at, original_price, deal_price, currency, discount_percent, image_url, external_url, created_by, status, heat_score, view_count) VALUES

('Netflix Premium 50% Off',
 'Get Netflix Premium plan at half price! Stream in 4K HDR on up to 4 devices. Limited time offer for new and returning subscribers.',
 'Netflix', 'Streaming', 'GLOBAL',
 now(), now() + interval '3 days',
 22.99, 11.49, 'USD', 50,
 'https://images.unsplash.com/photo-1574375927938-d5a98e8d7e28?w=600&h=340&fit=crop',
 'https://netflix.com',
 '00000000-0000-0000-0000-000000000000', 'approved', 85, 340),

('Steam Summer Sale — Up to 80% Off',
 'The legendary Steam Summer Sale is here! Thousands of games discounted up to 80%. Daily rotating flash deals available.',
 'Steam', 'Gaming', 'GLOBAL',
 now(), now() + interval '7 days',
 NULL, NULL, 'USD', 80,
 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&h=340&fit=crop',
 'https://store.steampowered.com',
 '00000000-0000-0000-0000-000000000000', 'approved', 120, 580),

('PS Plus Annual -30%',
 'PlayStation Plus yearly subscription at 30% off. Access hundreds of PS4 and PS5 games, online multiplayer, and exclusive discounts.',
 'PlayStation', 'Gaming', 'US',
 now(), now() + interval '5 days',
 79.99, 55.99, 'USD', 30,
 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=340&fit=crop',
 'https://playstation.com',
 '00000000-0000-0000-0000-000000000000', 'approved', 67, 215),

('Amazon Prime -40% (Turkey)',
 'Amazon Prime subscription at 40% discount for Turkey. Free shipping, Prime Video, Prime Gaming, and more included.',
 'Amazon', 'Streaming', 'TR',
 now(), now() + interval '2 days',
 57.99, 34.79, 'TRY', 40,
 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=600&h=340&fit=crop',
 'https://amazon.com.tr',
 '00000000-0000-0000-0000-000000000000', 'approved', 45, 178),

('X Premium -50%',
 'X (formerly Twitter) Premium at half price! Get verified badge, edit tweets, longer posts, and ad-free timeline.',
 'X (Twitter)', 'Social', 'GLOBAL',
 now(), now() + interval '4 days',
 8.00, 4.00, 'USD', 50,
 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=600&h=340&fit=crop',
 'https://x.com',
 '00000000-0000-0000-0000-000000000000', 'approved', 38, 145),

('Spotify Family -25% (Germany)',
 'Spotify Family plan for up to 6 accounts at 25% off. Premium features for everyone in your household.',
 'Spotify', 'Music', 'DE',
 now(), now() + interval '10 days',
 16.99, 12.74, 'EUR', 25,
 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=600&h=340&fit=crop',
 'https://spotify.com',
 '00000000-0000-0000-0000-000000000000', 'approved', 55, 230),

('Adobe Creative Cloud -40%',
 'Full Adobe Creative Cloud suite at 40% off. Photoshop, Illustrator, Premiere Pro, After Effects, and 20+ more apps.',
 'Adobe', 'Software', 'US',
 now(), now() + interval '6 days',
 59.99, 35.99, 'USD', 40,
 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=600&h=340&fit=crop',
 'https://adobe.com',
 '00000000-0000-0000-0000-000000000000', 'approved', 72, 310),

('NordVPN -70% + 3 Months Free',
 'NordVPN 2-year plan at 70% off plus 3 extra months free. Military-grade encryption, 5500+ servers worldwide.',
 'NordVPN', 'Security', 'GLOBAL',
 now(), now() + interval '14 days',
 11.99, 3.59, 'USD', 70,
 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=340&fit=crop',
 'https://nordvpn.com',
 '00000000-0000-0000-0000-000000000000', 'approved', 95, 420),

('Microsoft 365 Family -35%',
 'Microsoft 365 Family for up to 6 people. Includes Word, Excel, PowerPoint, OneDrive 1TB per person, and more.',
 'Microsoft', 'Software', 'GLOBAL',
 now() - interval '2 days', now() + interval '1 day',
 99.99, 64.99, 'USD', 35,
 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=600&h=340&fit=crop',
 'https://microsoft.com',
 '00000000-0000-0000-0000-000000000000', 'approved', 110, 490),

('Apple Music Student -50%',
 'Apple Music student plan at 50% off. Over 100 million songs, spatial audio, lossless quality. Verify with student email.',
 'Apple', 'Music', 'GLOBAL',
 now(), now() + interval '30 days',
 10.99, 5.49, 'USD', 50,
 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&h=340&fit=crop',
 'https://apple.com/music',
 '00000000-0000-0000-0000-000000000000', 'approved', 30, 95);
