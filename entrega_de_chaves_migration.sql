-- Migration: Add support for 'entrega_chaves' bill type
-- This migration adds a check constraint to validate bill_type values
-- and ensures the database schema supports the new consumption account type

-- Optional: Add check constraint to validate bill_type values
-- This ensures data integrity at the database level
ALTER TABLE contract_bills 
DROP CONSTRAINT IF EXISTS contract_bills_bill_type_check;

ALTER TABLE contract_bills 
ADD CONSTRAINT contract_bills_bill_type_check 
CHECK (bill_type IN ('energia', 'agua', 'condominio', 'gas', 'notificacao_rescisao', 'entrega_chaves'));

-- Note: The application code has been updated to:
-- 1. Include 'entrega_chaves' as a required bill type for all contracts
-- 2. Display it in the UI with appropriate icon (Key) and label (Entrega de Chaves)
-- 3. Allow toggling its delivery status like other consumption accounts
-- 4. Persist its state to the database

-- This constraint will prevent insertion of invalid bill_type values
-- and provides an extra layer of data validation beyond the application layer.

