-- 011_mp_public_key
-- Agrega la clave pública de MercadoPago al perfil.
-- La clave pública (distinta del access token) es segura de exponer
-- al frontend y permite usar MercadoPago Bricks / Wallet Button.

alter table profiles
  add column if not exists mp_public_key text;
