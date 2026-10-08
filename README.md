# Pure-Merch-Return

A simple page for keeping track of which **part + invoice** combinations have already been used for a supplier return.

## Setup (one time, for whoever sets up the PC)

1. Copy `returns.html` to the Desktop of the PC used for returns.
2. Open it in Chrome or Edge and leave that browser as the one used for it.
3. Optional: make a desktop shortcut called **Returns**.

No internet or installation is needed. Records are saved inside that browser on that PC.

## How to use (for the person doing returns)

1. Type the **part number**.
   - The page shows which invoices have already been used for that part.
2. Search the part number in email as usual and pick an invoice that is **not** on that list.
3. Type the **invoice number**.
   - **Green** = OK. Press **SAVE RETURN** (or Enter). Write the invoice number on the part.
   - **Red** = already used. Pick a different invoice.

Spaces, dashes and capital letters don't matter: `bp-1234` and `BP1234` count as the same part.

If one invoice had **more than one** of the same part, the small red link under the warning lets you save it again.

## Backup

Open **Past returns** and click **Save backup file** about once a week. If the browser data is ever
cleared or you move to a new PC, open the page and click **Load backup file**.
