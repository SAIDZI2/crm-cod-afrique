-- CRM COD Afrique — Donnees de test
-- Version 1.0

-- ============================================
-- UTILISATEURS
-- ============================================
INSERT INTO users (id, nom, email, password_hash, role, commission_pct, actif) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Said MB', 'said@crm.com', 'demo', 'media_buyer', 10, true),
  ('a1000000-0000-0000-0000-000000000002', 'Yassine RDC', 'yassine@crm.com', 'demo', 'media_buyer', 8, true),
  ('a1000000-0000-0000-0000-000000000003', 'Hamid RDC', 'hamid@crm.com', 'demo', 'media_buyer', 8, true),
  ('a1000000-0000-0000-0000-000000000004', 'Agent Karim', 'karim@crm.com', 'demo', 'call_center', 0, true),
  ('a1000000-0000-0000-0000-000000000005', 'Agent Fatima', 'fatima@crm.com', 'demo', 'call_center', 0, true),
  ('a1000000-0000-0000-0000-000000000006', 'Livreur Moise', 'moise@crm.com', 'demo', 'livreur', 5, true),
  ('a1000000-0000-0000-0000-000000000007', 'Livreur Patrick', 'patrick@crm.com', 'demo', 'livreur', 5, true),
  ('a1000000-0000-0000-0000-000000000008', 'Admin CRM', 'admin@crm.com', 'demo', 'admin', 0, true);

-- Sous-affilies de Said
UPDATE users SET parent_id = 'a1000000-0000-0000-0000-000000000001' WHERE id IN (
  'a1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000003'
);

-- ============================================
-- PRODUITS
-- ============================================
INSERT INTO produits (id, nom, sku, categorie, prix, commission_livraison, stock, statut_stock, actif) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Bee Venom Cream', 'BVC-001', 'Beaute', 35.00, 5.00, 150, 'en_stock', true),
  ('b1000000-0000-0000-0000-000000000002', 'Smartwatch Pro X', 'SWP-002', 'Electronique', 45.00, 7.00, 80, 'en_stock', true),
  ('b1000000-0000-0000-0000-000000000003', 'Hair Growth Serum', 'HGS-003', 'Beaute', 25.00, 4.00, 12, 'faible', true),
  ('b1000000-0000-0000-0000-000000000004', 'Wireless Earbuds V2', 'WEB-004', 'Electronique', 30.00, 5.00, 0, 'rupture', true),
  ('b1000000-0000-0000-0000-000000000005', 'Anti-Aging Eye Cream', 'AAE-005', 'Beaute', 40.00, 6.00, 200, 'en_stock', true),
  ('b1000000-0000-0000-0000-000000000006', 'Solar Power Bank 20K', 'SPB-006', 'Electronique', 28.00, 4.00, 95, 'en_stock', true);

-- ============================================
-- COMMANDES (30 commandes variees)
-- ============================================
INSERT INTO commandes (id, user_id, agent_id, livreur_id, destinataire_nom, telephone, adresse, ville, statut, montant_total, remise, source, created_at) VALUES
  ('KIN-A1B2C3D4E5', 'a1000000-0000-0000-0000-000000000001', NULL, NULL, 'Jean Kabila', '+243 812 345678', '12 Avenue Kasa-Vubu', 'Kinshasa', 'nouveau', 35.00, 0, 'Facebook Ads', now() - interval '5 minutes'),
  ('KIN-F6G7H8I9J0', 'a1000000-0000-0000-0000-000000000001', NULL, NULL, 'Marie Lumumba', '+243 813 456789', '45 Boulevard du 30 Juin', 'Kinshasa', 'nouveau', 45.00, 0, 'TikTok Ads', now() - interval '15 minutes'),
  ('LUB-K1L2M3N4O5', 'a1000000-0000-0000-0000-000000000001', NULL, NULL, 'Pierre Tshisekedi', '+243 814 567890', '8 Rue de la Gare', 'Lubumbashi', 'nouveau', 70.00, 5, 'Facebook Ads', now() - interval '1 hour'),
  ('GOM-P6Q7R8S9T0', 'a1000000-0000-0000-0000-000000000002', NULL, NULL, 'Alice Mukendi', '+243 815 678901', '23 Avenue du Lac', 'Goma', 'nouveau', 25.00, 0, 'Facebook Ads', now() - interval '2 hours'),
  ('KIS-U1V2W3X4Y5', 'a1000000-0000-0000-0000-000000000002', NULL, NULL, 'David Ngoma', '+243 816 789012', '56 Rue Principale', 'Kisangani', 'nouveau', 40.00, 0, 'TikTok Ads', now() - interval '3 hours'),
  ('MBU-Z6A7B8C9D0', 'a1000000-0000-0000-0000-000000000003', NULL, NULL, 'Sophie Kasongo', '+243 817 890123', '12 Avenue Mobutu', 'Mbuji-Mayi', 'nouveau', 28.00, 0, 'Facebook Ads', now() - interval '4 hours'),
  ('KIN-E1F2G3H4I5', 'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', NULL, 'Patrick Ilunga', '+243 818 901234', '78 Rue Victoire', 'Kinshasa', 'confirme', 35.00, 0, 'Facebook Ads', now() - interval '1 day'),
  ('LUB-J6K7L8M9N0', 'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', NULL, 'Grace Mbuyi', '+243 819 012345', '34 Boulevard Lumumba', 'Lubumbashi', 'confirme', 90.00, 0, 'TikTok Ads', now() - interval '1 day'),
  ('GOM-O1P2Q3R4S5', 'a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', NULL, 'Emmanuel Kasa', '+243 820 123456', '9 Rue du Commerce', 'Goma', 'confirme', 45.00, 0, 'Facebook Ads', now() - interval '1 day'),
  ('KIN-T6U7V8W9X0', 'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', NULL, 'Rachel Mbemba', '+243 821 234567', '67 Avenue de la Paix', 'Kinshasa', 'en_preparation', 65.00, 5, 'Facebook Ads', now() - interval '2 days'),
  ('LUB-Y1Z2A3B4C5', 'a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', NULL, 'Samuel Kazadi', '+243 822 345678', '21 Rue Katanga', 'Lubumbashi', 'en_preparation', 35.00, 0, 'TikTok Ads', now() - interval '2 days'),
  ('KIN-D6E7F8G9H0', 'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000006', 'Daniel Lukaku', '+243 823 456789', '89 Boulevard Triomphal', 'Kinshasa', 'expedie', 45.00, 0, 'Facebook Ads', now() - interval '3 days'),
  ('GOM-I1J2K3L4M5', 'a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000007', 'Christine Mutombo', '+243 824 567890', '15 Avenue Lac Kivu', 'Goma', 'expedie', 70.00, 0, 'TikTok Ads', now() - interval '3 days'),
  ('KIN-N6O7P8Q9R0', 'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000006', 'Joseph Kalala', '+243 825 678901', '43 Rue Sendwe', 'Kinshasa', 'livre', 35.00, 0, 'Facebook Ads', now() - interval '4 days'),
  ('LUB-S1T2U3V4W5', 'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000006', 'Esther Kalombo', '+243 826 789012', '76 Avenue Kasai', 'Lubumbashi', 'livre', 90.00, 0, 'TikTok Ads', now() - interval '4 days'),
  ('KIN-X6Y7Z8A9B0', 'a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000007', 'Benjamin Tshimanga', '+243 827 890123', '32 Rue des Martyrs', 'Kinshasa', 'livre', 45.00, 0, 'Facebook Ads', now() - interval '5 days'),
  ('GOM-C1D2E3F4G5', 'a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000007', 'Anne-Marie Kibwe', '+243 828 901234', '54 Boulevard Nyiragongo', 'Goma', 'livre', 25.00, 0, 'Facebook Ads', now() - interval '5 days'),
  ('KIN-H6I7J8K9L0', 'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', NULL, 'Michel Banza', '+243 829 012345', '18 Avenue Victoire', 'Kinshasa', 'echoue', 35.00, 0, 'TikTok Ads', now() - interval '2 days'),
  ('LUB-M1N2O3P4Q5', 'a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', NULL, 'Therese Nkulu', '+243 830 123456', '65 Rue de la Mine', 'Lubumbashi', 'echoue', 45.00, 0, 'Facebook Ads', now() - interval '3 days'),
  ('KIS-R6S7T8U9V0', 'a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004', NULL, 'Simon Kabange', '+243 831 234567', '27 Rue Orientale', 'Kisangani', 'echoue', 28.00, 0, 'TikTok Ads', now() - interval '3 days'),
  ('KIN-W1X2Y3Z4A5', 'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', NULL, 'Francoise Ilunga', '+243 832 345678', '91 Boulevard Lumumba', 'Kinshasa', 'reporte', 70.00, 0, 'Facebook Ads', now() - interval '1 day'),
  ('GOM-B6C7D8E9F0', 'a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', NULL, 'Jacques Mundele', '+243 833 456789', '38 Avenue du Lac', 'Goma', 'reporte', 40.00, 0, 'TikTok Ads', now() - interval '1 day'),
  ('KIN-G1H2I3J4K5', 'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000006', 'Pauline Ngandu', '+243 834 567890', '52 Rue Kintambo', 'Kinshasa', 'en_retour', 35.00, 0, 'Facebook Ads', now() - interval '5 days'),
  ('LUB-L6M7N8O9P0', 'a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000007', 'Antoine Mwamba', '+243 835 678901', '14 Avenue Lofoi', 'Lubumbashi', 'en_retour', 45.00, 0, 'TikTok Ads', now() - interval '5 days'),
  ('KIN-Q1R2S3T4U5', 'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000006', 'Catherine Mbombo', '+243 836 789012', '73 Rue Limete', 'Kinshasa', 'retourne', 25.00, 0, 'Facebook Ads', now() - interval '6 days'),
  ('GOM-V6W7X8Y9Z0', 'a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000007', 'Robert Kasongo', '+243 837 890123', '29 Boulevard Volcano', 'Goma', 'retourne', 45.00, 0, 'TikTok Ads', now() - interval '6 days'),
  ('KIN-A2B3C4D5E6', 'a1000000-0000-0000-0000-000000000001', NULL, NULL, 'Louise Kabedi', '+243 838 901234', '84 Avenue Liberte', 'Kinshasa', 'nouveau', 80.00, 0, 'Facebook Ads', now() - interval '10 minutes'),
  ('LUB-F7G8H9I0J1', 'a1000000-0000-0000-0000-000000000003', NULL, NULL, 'Mathieu Tshibangu', '+243 839 012345', '47 Rue Kolwezi', 'Lubumbashi', 'nouveau', 56.00, 0, 'TikTok Ads', now() - interval '25 minutes'),
  ('BUK-K2L3M4N5O6', 'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000006', 'Veronique Ntumba', '+243 840 123456', '16 Avenue Panzi', 'Bukavu', 'livre', 35.00, 0, 'Facebook Ads', now() - interval '7 days'),
  ('KIN-P7Q8R9S0T1', 'a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000006', 'Georges Kabongo', '+243 841 234567', '61 Rue Matadi', 'Kinshasa', 'livre', 70.00, 5, 'TikTok Ads', now() - interval '7 days');

-- ============================================
-- COMMANDE_PRODUITS
-- ============================================
INSERT INTO commande_produits (commande_id, produit_id, quantite, prix_unitaire, type) VALUES
  ('KIN-A1B2C3D4E5', 'b1000000-0000-0000-0000-000000000001', 1, 35.00, 'principal'),
  ('KIN-F6G7H8I9J0', 'b1000000-0000-0000-0000-000000000002', 1, 45.00, 'principal'),
  ('LUB-K1L2M3N4O5', 'b1000000-0000-0000-0000-000000000001', 2, 35.00, 'principal'),
  ('GOM-P6Q7R8S9T0', 'b1000000-0000-0000-0000-000000000003', 1, 25.00, 'principal'),
  ('KIS-U1V2W3X4Y5', 'b1000000-0000-0000-0000-000000000005', 1, 40.00, 'principal'),
  ('MBU-Z6A7B8C9D0', 'b1000000-0000-0000-0000-000000000006', 1, 28.00, 'principal'),
  ('KIN-E1F2G3H4I5', 'b1000000-0000-0000-0000-000000000001', 1, 35.00, 'principal'),
  ('LUB-J6K7L8M9N0', 'b1000000-0000-0000-0000-000000000002', 2, 45.00, 'principal'),
  ('GOM-O1P2Q3R4S5', 'b1000000-0000-0000-0000-000000000002', 1, 45.00, 'principal'),
  ('KIN-T6U7V8W9X0', 'b1000000-0000-0000-0000-000000000001', 1, 35.00, 'principal'),
  ('KIN-T6U7V8W9X0', 'b1000000-0000-0000-0000-000000000006', 1, 28.00, 'upsell'),
  ('LUB-Y1Z2A3B4C5', 'b1000000-0000-0000-0000-000000000001', 1, 35.00, 'principal'),
  ('KIN-D6E7F8G9H0', 'b1000000-0000-0000-0000-000000000002', 1, 45.00, 'principal'),
  ('GOM-I1J2K3L4M5', 'b1000000-0000-0000-0000-000000000001', 2, 35.00, 'principal'),
  ('KIN-N6O7P8Q9R0', 'b1000000-0000-0000-0000-000000000001', 1, 35.00, 'principal'),
  ('LUB-S1T2U3V4W5', 'b1000000-0000-0000-0000-000000000002', 2, 45.00, 'principal'),
  ('KIN-X6Y7Z8A9B0', 'b1000000-0000-0000-0000-000000000002', 1, 45.00, 'principal'),
  ('GOM-C1D2E3F4G5', 'b1000000-0000-0000-0000-000000000003', 1, 25.00, 'principal'),
  ('KIN-H6I7J8K9L0', 'b1000000-0000-0000-0000-000000000001', 1, 35.00, 'principal'),
  ('LUB-M1N2O3P4Q5', 'b1000000-0000-0000-0000-000000000002', 1, 45.00, 'principal'),
  ('KIS-R6S7T8U9V0', 'b1000000-0000-0000-0000-000000000006', 1, 28.00, 'principal'),
  ('KIN-W1X2Y3Z4A5', 'b1000000-0000-0000-0000-000000000001', 2, 35.00, 'principal'),
  ('GOM-B6C7D8E9F0', 'b1000000-0000-0000-0000-000000000005', 1, 40.00, 'principal'),
  ('KIN-G1H2I3J4K5', 'b1000000-0000-0000-0000-000000000001', 1, 35.00, 'principal'),
  ('LUB-L6M7N8O9P0', 'b1000000-0000-0000-0000-000000000002', 1, 45.00, 'principal'),
  ('KIN-Q1R2S3T4U5', 'b1000000-0000-0000-0000-000000000003', 1, 25.00, 'principal'),
  ('GOM-V6W7X8Y9Z0', 'b1000000-0000-0000-0000-000000000002', 1, 45.00, 'principal'),
  ('KIN-A2B3C4D5E6', 'b1000000-0000-0000-0000-000000000002', 1, 45.00, 'principal'),
  ('KIN-A2B3C4D5E6', 'b1000000-0000-0000-0000-000000000001', 1, 35.00, 'upsell'),
  ('LUB-F7G8H9I0J1', 'b1000000-0000-0000-0000-000000000006', 2, 28.00, 'principal'),
  ('BUK-K2L3M4N5O6', 'b1000000-0000-0000-0000-000000000001', 1, 35.00, 'principal'),
  ('KIN-P7Q8R9S0T1', 'b1000000-0000-0000-0000-000000000001', 2, 35.00, 'principal');

-- ============================================
-- DEPENSES PUBLICITAIRES
-- ============================================
INSERT INTO depenses (user_id, produit_id, date_depense, montant, note) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', '2026-03-01', 150.00, 'Facebook Ads - Bee Venom S1'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', '2026-03-03', 200.00, 'TikTok Ads - Smartwatch'),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', '2026-03-05', 100.00, 'Facebook Ads - Bee Venom S2'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005', '2026-03-08', 180.00, 'Instagram Ads - Anti-Aging'),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', '2026-03-10', 120.00, 'Facebook Ads - Power Bank'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', '2026-03-12', 175.00, 'Facebook Ads - Bee Venom S3');

-- ============================================
-- COMMISSIONS (pour les livres)
-- ============================================
INSERT INTO commissions (user_id, commande_id, montant, statut) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'KIN-N6O7P8Q9R0', 5.00, 'approuvee'),
  ('a1000000-0000-0000-0000-000000000001', 'LUB-S1T2U3V4W5', 14.00, 'approuvee'),
  ('a1000000-0000-0000-0000-000000000002', 'KIN-X6Y7Z8A9B0', 7.00, 'en_attente'),
  ('a1000000-0000-0000-0000-000000000003', 'GOM-C1D2E3F4G5', 4.00, 'payee'),
  ('a1000000-0000-0000-0000-000000000001', 'BUK-K2L3M4N5O6', 5.00, 'en_attente'),
  ('a1000000-0000-0000-0000-000000000002', 'KIN-P7Q8R9S0T1', 10.00, 'en_attente');

-- ============================================
-- APPELS
-- ============================================
INSERT INTO appels (commande_id, agent_id, duree_secondes, resultat, note) VALUES
  ('KIN-E1F2G3H4I5', 'a1000000-0000-0000-0000-000000000004', 180, 'confirme', 'Client disponible, adresse confirmee'),
  ('LUB-J6K7L8M9N0', 'a1000000-0000-0000-0000-000000000004', 120, 'confirme', 'OK'),
  ('GOM-O1P2Q3R4S5', 'a1000000-0000-0000-0000-000000000005', 90, 'confirme', NULL),
  ('KIN-H6I7J8K9L0', 'a1000000-0000-0000-0000-000000000004', 30, 'pas_de_reponse', 'Numero ne repond pas'),
  ('KIN-H6I7J8K9L0', 'a1000000-0000-0000-0000-000000000004', 15, 'occupe', 'Ligne occupee'),
  ('KIN-H6I7J8K9L0', 'a1000000-0000-0000-0000-000000000004', 0, 'echoue', 'Injoignable apres 3 tentatives'),
  ('LUB-M1N2O3P4Q5', 'a1000000-0000-0000-0000-000000000005', 45, 'echoue', 'Refuse la commande'),
  ('KIN-W1X2Y3Z4A5', 'a1000000-0000-0000-0000-000000000004', 90, 'reporte', 'Rappeler apres 18h'),
  ('GOM-B6C7D8E9F0', 'a1000000-0000-0000-0000-000000000005', 60, 'reporte', 'Client en deplacement, rappeler demain matin'),
  ('KIN-N6O7P8Q9R0', 'a1000000-0000-0000-0000-000000000004', 150, 'confirme', 'Confirme avec upsell'),
  ('LUB-S1T2U3V4W5', 'a1000000-0000-0000-0000-000000000004', 200, 'confirme', 'Commande double confirmee');

-- ============================================
-- RAPPELS
-- ============================================
INSERT INTO rappels (commande_id, agent_id, date_rappel, statut, note) VALUES
  ('KIN-W1X2Y3Z4A5', 'a1000000-0000-0000-0000-000000000004', now() + interval '2 hours', 'en_attente', 'Rappeler apres 18h'),
  ('GOM-B6C7D8E9F0', 'a1000000-0000-0000-0000-000000000005', now() + interval '1 day', 'en_attente', 'Rappeler demain matin 9h');

-- ============================================
-- TOURNEES
-- ============================================
INSERT INTO tournees (id, livreur_id, date, statut, created_by) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006', CURRENT_DATE, 'en_cours', 'a1000000-0000-0000-0000-000000000008'),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000007', CURRENT_DATE, 'en_cours', 'a1000000-0000-0000-0000-000000000008');

-- ============================================
-- TOURNEE_COMMANDES
-- ============================================
INSERT INTO tournee_commandes (tournee_id, commande_id, ordre, statut_livraison, montant_collecte) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'KIN-D6E7F8G9H0', 1, 'en_cours', NULL),
  ('c1000000-0000-0000-0000-000000000001', 'KIN-N6O7P8Q9R0', 2, 'livre', 35.00),
  ('c1000000-0000-0000-0000-000000000001', 'LUB-S1T2U3V4W5', 3, 'livre', 90.00),
  ('c1000000-0000-0000-0000-000000000001', 'KIN-G1H2I3J4K5', 4, 'retourne', NULL),
  ('c1000000-0000-0000-0000-000000000001', 'KIN-Q1R2S3T4U5', 5, 'retourne', NULL),
  ('c1000000-0000-0000-0000-000000000001', 'BUK-K2L3M4N5O6', 6, 'livre', 35.00),
  ('c1000000-0000-0000-0000-000000000002', 'GOM-I1J2K3L4M5', 1, 'en_cours', NULL),
  ('c1000000-0000-0000-0000-000000000002', 'KIN-X6Y7Z8A9B0', 2, 'livre', 45.00),
  ('c1000000-0000-0000-0000-000000000002', 'GOM-C1D2E3F4G5', 3, 'livre', 25.00),
  ('c1000000-0000-0000-0000-000000000002', 'LUB-L6M7N8O9P0', 4, 'retourne', NULL),
  ('c1000000-0000-0000-0000-000000000002', 'GOM-V6W7X8Y9Z0', 5, 'retourne', NULL),
  ('c1000000-0000-0000-0000-000000000002', 'KIN-P7Q8R9S0T1', 6, 'livre', 65.00);

-- ============================================
-- RETOURS
-- ============================================
INSERT INTO retours (commande_id, livreur_id, motif, note, recu_au_depot) VALUES
  ('KIN-G1H2I3J4K5', 'a1000000-0000-0000-0000-000000000006', 'absent', 'Client absent a l adresse', false),
  ('KIN-Q1R2S3T4U5', 'a1000000-0000-0000-0000-000000000006', 'refus', 'Client refuse le colis', true),
  ('LUB-L6M7N8O9P0', 'a1000000-0000-0000-0000-000000000007', 'adresse_introuvable', 'Adresse incorrecte', false),
  ('GOM-V6W7X8Y9Z0', 'a1000000-0000-0000-0000-000000000007', 'ne_peut_pas_payer', 'Client n a pas l argent', true);

-- ============================================
-- REMISES CASH
-- ============================================
INSERT INTO remises_cash (livreur_id, tournee_id, montant_remis, montant_theorique, note) VALUES
  ('a1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001', 155.00, 160.00, 'Ecart du au rendu monnaie');

-- ============================================
-- BLACKLIST
-- ============================================
INSERT INTO blacklist (telephone, motif, user_id) VALUES
  ('+243 899 000000', 'Faux numero - 3 commandes annulees', 'a1000000-0000-0000-0000-000000000001'),
  ('+243 899 111111', 'Arnaque - jamais disponible', 'a1000000-0000-0000-0000-000000000004'),
  ('+243 899 222222', 'Numero invalide', 'a1000000-0000-0000-0000-000000000005');
