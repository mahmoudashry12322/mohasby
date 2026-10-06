ALTER TABLE "JournalLine" ADD CONSTRAINT "journal_line_positive_one_side"
CHECK (("debit" > 0 AND "credit" = 0) OR ("credit" > 0 AND "debit" = 0));
ALTER TABLE "StockMovement" ADD CONSTRAINT "stock_positive_quantity" CHECK ("quantity" > 0 AND "unitCost" >= 0 AND "value" >= 0 AND "direction" IN (-1, 1));
ALTER TABLE "FiscalPeriod" ADD CONSTRAINT "period_valid_dates" CHECK ("start" <= "end");
ALTER TABLE "JournalEntry" ADD CONSTRAINT "entry_valid_status" CHECK ("status" IN ('DRAFT','POSTED','VOID'));
ALTER TABLE "User" ADD CONSTRAINT "user_valid_role" CHECK ("role" IN ('admin','accountant','auditor'));

CREATE FUNCTION check_posted_entry_balance() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target_id text; target_status text; debit_total numeric; credit_total numeric; line_count integer;
BEGIN
  IF TG_TABLE_NAME = 'JournalEntry' THEN
    target_id := NEW.id;
  ELSE
    IF TG_OP = 'DELETE' THEN target_id := OLD."entryId";
    ELSE target_id := NEW."entryId"; END IF;
  END IF;
  SELECT status INTO target_status FROM "JournalEntry" WHERE id = target_id;
  IF target_status = 'POSTED' THEN
    SELECT COALESCE(SUM(debit),0), COALESCE(SUM(credit),0), COUNT(*) INTO debit_total,credit_total,line_count FROM "JournalLine" WHERE "entryId" = target_id;
    IF debit_total <> credit_total OR debit_total <= 0 OR line_count < 2 THEN
      RAISE EXCEPTION 'Posted journal must balance and have at least two positive lines';
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER journal_header_balance AFTER INSERT OR UPDATE ON "JournalEntry"
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_posted_entry_balance();
CREATE CONSTRAINT TRIGGER journal_line_balance AFTER INSERT OR UPDATE OR DELETE ON "JournalLine"
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_posted_entry_balance();
