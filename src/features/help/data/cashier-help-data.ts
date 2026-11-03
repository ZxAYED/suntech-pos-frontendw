// Derived mechanically from docs/SunTech_Cashier_Help_Content.md
// Editorial source: docs/SunTech_Cashier_Help_Content.md
// Finished user-facing content. HTML comments are excluded.
import type { HelpGuideData } from "../types";

export const cashierHelpData: HelpGuideData = {
  "role": "cashier",
  "title": "Help — Cashier",
  "sourceDoc": "docs/SunTech_Cashier_Help_Content.md",
  "intro": {
    "paragraphs": [
      "This guide helps you sell items, print bills, return money, check your cash, and record a salary advance.",
      "Choose what you need below. Follow the steps in order. Words in **bold** match words on the screen."
    ],
    "workflowText": "**A normal workday:** Sign in → Check your branch → Open your shift if you are counting drawer cash → Make sales → Count cash and close the shift → Sign out.",
    "extraNote": "You can still make a sale or record an advance without an open shift. A shift helps you keep track of the cash you handle."
  },
  "quickLinks": [
    {
      "want": "Sign in or learn the buttons",
      "label": "Start here",
      "topicId": "1-start-here"
    },
    {
      "want": "Sell an item shown on the screen",
      "label": "Catalog Register",
      "topicId": "2-catalog-register--sell-a-saved-item"
    },
    {
      "want": "Sell a service or type an item myself",
      "label": "Quick Custom Sale",
      "topicId": "3-quick-custom-sale--type-an-item-and-sell-it"
    },
    {
      "want": "Find a sale, print a bill, or return money",
      "label": "Orders",
      "topicId": "4-orders--find-a-sale-print-or-refund"
    },
    {
      "want": "Start, count, or close my cash drawer",
      "label": "Shifts",
      "topicId": "5-shifts--start-and-finish-your-cash-count"
    },
    {
      "want": "Record salary money taken early",
      "label": "My Salary Advances",
      "topicId": "6-my-salary-advances--record-money-taken-early"
    },
    {
      "want": "Know what to do after an error",
      "label": "When something goes wrong",
      "topicId": "7-when-something-goes-wrong"
    },
    {
      "want": "Check my work before leaving",
      "label": "End of work",
      "topicId": "8-end-of-work"
    },
    {
      "want": "Understand a word",
      "label": "Simple word guide",
      "topicId": "9-simple-word-guide"
    }
  ],
  "topics": [
    {
      "id": "1-start-here",
      "number": 1,
      "title": "Start here",
      "fullTitle": "1. Start here",
      "blocks": [
        {
          "type": "heading",
          "level": 3,
          "text": "Sign in to your own account"
        },
        {
          "type": "steps",
          "items": [
            "Open the sign-in page. Choose **Cashier**.",
            "In **Terminal Public ID**, enter the cashier ID your Admin gave you.",
            "Enter your **Password**.",
            "Click **Sign in as Cashier**.",
            "Check your name and the branch shown by the app, where available."
          ]
        },
        {
          "type": "paragraph",
          "text": "Your Admin assigns your business and branch. You do not need to choose a business for each sale. If the assignment is wrong, ask your Admin to correct it."
        },
        {
          "type": "remember",
          "text": "Use your own ID. If you forget the ID or password, ask your Admin; do not use another cashier's account."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Your four work pages"
        },
        {
          "type": "table",
          "headers": [
            "Menu name",
            "What you do there"
          ],
          "rows": [
            [
              "**Catalog Register**",
              "Sell an item that is already in the shop's list."
            ],
            [
              "**Quick Custom Sale**",
              "Type an item or service and record a sale."
            ],
            [
              "**Shifts**",
              "Start and close a shift, check cash, and record your salary advances."
            ],
            [
              "**Orders**",
              "Find your saved sales, print bills, and record returns."
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "The Admin has other pages for products, staff, salary payments, and shop expenses. You do not need those pages to do cashier work."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Common buttons"
        },
        {
          "type": "table",
          "headers": [
            "Button or picture",
            "Meaning"
          ],
          "rows": [
            [
              "**+ / −**",
              "Add one / take away one. Check which item you are changing."
            ],
            [
              "**×** on an item line",
              "Remove that item from an unsaved ticket."
            ],
            [
              "Bin beside **Current ticket**",
              "Clear the unsaved item list. It does not cancel an old sale."
            ],
            [
              "Pause beside **Current ticket**",
              "Hold the item list for later in this tab."
            ],
            [
              "**…** on an order",
              "Open that order's actions."
            ],
            [
              "**Cancel**, or **×** at the top of a box",
              "Close that box. It does not undo a saved action."
            ],
            [
              "**Rows**",
              "Change how many results appear on one page."
            ],
            [
              "**> / Next page**, **< / Previous page**",
              "Move through results. This does not save a sale."
            ],
            [
              "**>> / Last page**, **<< / First page**",
              "Go to the last or first page."
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "For money boxes, type whole taka, such as **500**. For quantity, type the number of items. A grey button may need you to finish a box, choose an item, or wait for a request to finish. On a phone, use the top menu button to open the menu. Move a wide table sideways to see its last columns."
        }
      ],
      "searchIndex": "1. Start here Sign in to your own account Open the sign-in page. Choose Cashier. In Terminal Public ID, enter the cashier ID your Admin gave you. Enter your Password. Click Sign in as Cashier. Check your name and the branch shown by the app, where available. Your Admin assigns your business and branch. You do not need to choose a business for each sale. If the assignment is wrong, ask your Admin to correct it. Remember Use your own ID. If you forget the ID or password, ask your Admin; do not use another cashier's account. Your four work pages Menu name What you do there Catalog Register Sell an item that is already in the shop's list. Quick Custom Sale Type an item or service and record a sale. Shifts Start and close a shift, check cash, and record your salary advances. Orders Find your saved sales, print bills, and record returns. The Admin has other pages for products, staff, salary payments, and shop expenses. You do not need those pages to do cashier work. Common buttons Button or picture Meaning + / − Add one / take away one. Check which item you are changing. × on an item line Remove that item from an unsaved ticket. Bin beside Current ticket Clear the unsaved item list. It does not cancel an old sale. Pause beside Current ticket Hold the item list for later in this tab. … on an order Open that order's actions. Cancel, or × at the top of a box Close that box. It does not undo a saved action. Rows Change how many results appear on one page. > / Next page, < / Previous page Move through results. This does not save a sale. >> / Last page, << / First page Go to the last or first page. For money boxes, type whole taka, such as 500. For quantity, type the number of items. A grey button may need you to finish a box, choose an item, or wait for a request to finish. On a phone, use the top menu button to open the menu. Move a wide table sideways to see its last columns."
    },
    {
      "id": "2-catalog-register--sell-a-saved-item",
      "number": 2,
      "title": "Catalog Register — sell a saved item",
      "fullTitle": "2. Catalog Register — sell a saved item",
      "blocks": [
        {
          "type": "callout",
          "label": "Open:",
          "text": "Left menu → **Catalog Register**."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Find the right item"
        },
        {
          "type": "paragraph",
          "text": "Use the search box for the product name, variant, SKU, or barcode. Use a category button or **All categories** to show a group of items. Scroll down to see more items. You can click **Scroll down to load more** when that button appears. A **variant** is the exact kind of an item. For example, the black phone and the blue phone may be different variants. Check the small name below the product name. Do not choose only by the picture. If your shop uses a connected barcode scanner, scan an item on this page and check what was added. You can also type or search its barcode. If no item is found, ask Admin to check its saved barcode."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Add the items"
        },
        {
          "type": "steps",
          "items": [
            "Click the blue **+** on the correct item card.",
            "Find it in **Current ticket** on the right.",
            "Use **+** or **−** to set how many the customer is buying.",
            "Use **×** beside a line to remove that line.",
            "Add the other items and check **Subtotal**."
          ]
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Add the customer, if wanted"
        },
        {
          "type": "steps",
          "items": [
            "Click **Add Customer**.",
            "Ask the customer's name and phone number before saving them.",
            "Enter the correct details and click **Done**.",
            "Use **Edit** to correct them before the sale."
          ]
        },
        {
          "type": "paragraph",
          "text": "Without a name, the app uses **Walk-in Customer**. This is allowed. The small reset button beside customer details clears them back to that choice. A name helps you recognise a sale later. A correct phone number can be kept with the bill and may help future customer-support features. There is no need to promise the customer automatic messages or rewards."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Choose how the customer paid"
        },
        {
          "type": "table",
          "headers": [
            "On the screen",
            "What to check"
          ],
          "rows": [
            [
              "**Cash (COD)**",
              "Count the cash the customer gives you."
            ],
            [
              "**bKash**",
              "Check that the shop received the bKash payment."
            ],
            [
              "**Nagad**",
              "Check that the shop received the Nagad payment."
            ],
            [
              "**Bank / Card**",
              "Check the shop's bank or card payment result."
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "Clicking one of these choices records the payment type. It does not collect the phone or bank payment for you."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Finish a cash sale"
        },
        {
          "type": "steps",
          "items": [
            "Choose **Cash (COD)**.",
            "In **Cash Given**, enter the cash you actually received.",
            "If the customer gave the exact bill amount, click **Exact**.",
            "Check **Change**. This is the cash you give back.",
            "Check the items, quantities, customer, and total.",
            "Click **Complete sale** once.",
            "Wait for the saved sale and receipt. Give the correct change and bill."
          ]
        },
        {
          "type": "example",
          "label": "Example:",
          "text": "The bill is 400 BDT. The customer gives 500 BDT. Enter **500**. Give back **100 BDT**. Do not click **Exact** in this example, because the customer gave more than the bill."
        },
        {
          "type": "paragraph",
          "text": "For bKash, Nagad, or Bank / Card, check the real payment first, select the matching choice, and then complete the sale."
        },
        {
          "type": "remember",
          "text": "Check the amount and payment choice before clicking. If the result is unclear, do not create the same sale again; see part 7."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Pause a customer's item list"
        },
        {
          "type": "steps",
          "items": [
            "With items in the ticket, click the pause picture, **Hold ticket**.",
            "The item list moves to **Held in this tab**. You can serve another customer.",
            "Finish or hold the other ticket before opening the saved one.",
            "Click the held ticket to bring its items back.",
            "Recheck customer details, price, and payment before completing it."
          ]
        },
        {
          "type": "remember",
          "text": "A held ticket is not a paid sale and is not shared with other devices. Do not close the tab expecting it to act as a saved bill."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Low stock or a missing item"
        },
        {
          "type": "paragraph",
          "text": "A low-stock label tells you the app's recorded stock is low. Check the physical item. Tell Admin if the number is wrong. The app can allow a sale even when its stock number is zero or below zero. If an item is missing, clear the category filter and search again. Ask Admin to add or fix the variant. Do not change a different item's name to pretend it is the missing item."
        }
      ],
      "searchIndex": "2. Catalog Register — sell a saved item Open: Left menu → Catalog Register. Find the right item Use the search box for the product name, variant, SKU, or barcode. Use a category button or All categories to show a group of items. Scroll down to see more items. You can click Scroll down to load more when that button appears. A variant is the exact kind of an item. For example, the black phone and the blue phone may be different variants. Check the small name below the product name. Do not choose only by the picture. If your shop uses a connected barcode scanner, scan an item on this page and check what was added. You can also type or search its barcode. If no item is found, ask Admin to check its saved barcode. Add the items Click the blue + on the correct item card. Find it in Current ticket on the right. Use + or − to set how many the customer is buying. Use × beside a line to remove that line. Add the other items and check Subtotal. Add the customer, if wanted Click Add Customer. Ask the customer's name and phone number before saving them. Enter the correct details and click Done. Use Edit to correct them before the sale. Without a name, the app uses Walk-in Customer. This is allowed. The small reset button beside customer details clears them back to that choice. A name helps you recognise a sale later. A correct phone number can be kept with the bill and may help future customer-support features. There is no need to promise the customer automatic messages or rewards. Choose how the customer paid On the screen What to check Cash (COD) Count the cash the customer gives you. bKash Check that the shop received the bKash payment. Nagad Check that the shop received the Nagad payment. Bank / Card Check the shop's bank or card payment result. Clicking one of these choices records the payment type. It does not collect the phone or bank payment for you. Finish a cash sale Choose Cash (COD). In Cash Given, enter the cash you actually received. If the customer gave the exact bill amount, click Exact. Check Change. This is the cash you give back. Check the items, quantities, customer, and total. Click Complete sale once. Wait for the saved sale and receipt. Give the correct change and bill. Example: The bill is 400 BDT. The customer gives 500 BDT. Enter 500. Give back 100 BDT. Do not click Exact in this example, because the customer gave more than the bill. For bKash, Nagad, or Bank / Card, check the real payment first, select the matching choice, and then complete the sale. Remember Check the amount and payment choice before clicking. If the result is unclear, do not create the same sale again; see part 7. Pause a customer's item list With items in the ticket, click the pause picture, Hold ticket. The item list moves to Held in this tab. You can serve another customer. Finish or hold the other ticket before opening the saved one. Click the held ticket to bring its items back. Recheck customer details, price, and payment before completing it. Remember A held ticket is not a paid sale and is not shared with other devices. Do not close the tab expecting it to act as a saved bill. Low stock or a missing item A low-stock label tells you the app's recorded stock is low. Check the physical item. Tell Admin if the number is wrong. The app can allow a sale even when its stock number is zero or below zero. If an item is missing, clear the category filter and search again. Ask Admin to add or fix the variant. Do not change a different item's name to pretend it is the missing item."
    },
    {
      "id": "3-quick-custom-sale--type-an-item-and-sell-it",
      "number": 3,
      "title": "Quick Custom Sale — type an item and sell it",
      "fullTitle": "3. Quick Custom Sale — type an item and sell it",
      "blocks": [
        {
          "type": "callout",
          "label": "Open:",
          "text": "Left menu → **Quick Custom Sale**. Page heading: **Direct Custom Sale**."
        },
        {
          "type": "paragraph",
          "text": "Use this for a service or a sale that needs typed item details. It does not create a Catalog product or change its stock."
        },
        {
          "type": "steps",
          "items": [
            "In **Product or service name**, type a clear name.",
            "Add **Variant or style** only if needed.",
            "In **Unit price (BDT)**, enter the price of one item.",
            "Set **Quantity**. Use **+**, **−**, or the quantity box.",
            "Check **Line total**. Click **Add another item** for another line.",
            "Use the bin on an extra line to remove it if it is wrong.",
            "Add **Customer name** and **Customer phone** if wanted.",
            "Choose **Payment method**.",
            "For cash, enter **Paid amount (BDT)**, or use **Exact** for the exact total received.",
            "Check **Total**, then click **Complete sale** once. Wait for the receipt."
          ]
        },
        {
          "type": "example",
          "label": "Example:",
          "text": "One service costs 150 BDT. Quantity 2 gives a total of **300 BDT**."
        },
        {
          "type": "remember",
          "text": "Use **Catalog Register** for saved stock items so their stock changes correctly. Do not use a custom sale to enter the same sale a second time."
        }
      ],
      "searchIndex": "3. Quick Custom Sale — type an item and sell it Open: Left menu → Quick Custom Sale. Page heading: Direct Custom Sale. Use this for a service or a sale that needs typed item details. It does not create a Catalog product or change its stock. In Product or service name, type a clear name. Add Variant or style only if needed. In Unit price (BDT), enter the price of one item. Set Quantity. Use +, −, or the quantity box. Check Line total. Click Add another item for another line. Use the bin on an extra line to remove it if it is wrong. Add Customer name and Customer phone if wanted. Choose Payment method. For cash, enter Paid amount (BDT), or use Exact for the exact total received. Check Total, then click Complete sale once. Wait for the receipt. Example: One service costs 150 BDT. Quantity 2 gives a total of 300 BDT. Remember Use Catalog Register for saved stock items so their stock changes correctly. Do not use a custom sale to enter the same sale a second time."
    },
    {
      "id": "4-orders--find-a-sale-print-or-refund",
      "number": 4,
      "title": "Orders — find a sale, print, or refund",
      "fullTitle": "4. Orders — find a sale, print, or refund",
      "blocks": [
        {
          "type": "callout",
          "label": "Open:",
          "text": "Left menu → **Orders**. Page heading: **Register Tickets & Order History**."
        },
        {
          "type": "paragraph",
          "text": "This is your own sales view. Ask Admin to find a sale made by another cashier."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Find the bill"
        },
        {
          "type": "steps",
          "items": [
            "Search by invoice number, customer, or item.",
            "Use **All statuses**, **All payments**, or **All order types** to narrow the list.",
            "Use the page arrows if there are more results.",
            "Click **…** on the correct row, then **View details**.",
            "Check the date, customer, items, quantities, payment, and total."
          ]
        },
        {
          "type": "table",
          "headers": [
            "Status",
            "Meaning"
          ],
          "rows": [
            [
              "**PAID**",
              "The sale is saved as paid."
            ],
            [
              "**PARTIALLY REFUNDED**",
              "Some of the sale has been returned."
            ],
            [
              "**REFUNDED**",
              "All eligible items in the sale have been refunded."
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "A blank list may mean a search or filter is hiding the sale. Clear the filters before deciding that it is missing."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Print a receipt again"
        },
        {
          "type": "steps",
          "items": [
            "Find the sale. Click **…** → **Print receipt**.",
            "In **Order Receipt**, use **Print (P)** to print.",
            "Choose the right printer and follow the print window.",
            "Use **PDF** for the PDF action, or **TXT** to save a simple text copy, when needed."
          ]
        },
        {
          "type": "paragraph",
          "text": "You can also click **Print receipt** inside **View details**. Printing again does not create a second sale. Closing the print window does not cancel the sale."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Return money for returned items"
        },
        {
          "type": "steps",
          "items": [
            "Find the original sale. Click **…** → **Refund**.",
            "Check the item and **Refundable** number. It shows how many can still be returned.",
            "Enter only the number the customer is returning. Leave other lines at 0.",
            "Add a **Reason** if useful.",
            "Check **Refund total**.",
            "Click **Confirm refund** once and wait for confirmation.",
            "Check the order's new status. Handle the real money return through your shop's process, once only."
          ]
        },
        {
          "type": "example",
          "label": "Example:",
          "text": "The customer bought three items at 200 BDT each and returns one. The refund is **200 BDT**, not 600 BDT."
        },
        {
          "type": "paragraph",
          "text": "The form does not let you choose a different payment method. A recorded refund is not an automatic bKash, Nagad, or bank transfer."
        },
        {
          "type": "remember",
          "text": "Check the actual returned items and amount. If the sale or refund is not available to you, ask Admin rather than making a new sale to adjust it."
        }
      ],
      "searchIndex": "4. Orders — find a sale, print, or refund Open: Left menu → Orders. Page heading: Register Tickets & Order History. This is your own sales view. Ask Admin to find a sale made by another cashier. Find the bill Search by invoice number, customer, or item. Use All statuses, All payments, or All order types to narrow the list. Use the page arrows if there are more results. Click … on the correct row, then View details. Check the date, customer, items, quantities, payment, and total. Status Meaning PAID The sale is saved as paid. PARTIALLY REFUNDED Some of the sale has been returned. REFUNDED All eligible items in the sale have been refunded. A blank list may mean a search or filter is hiding the sale. Clear the filters before deciding that it is missing. Print a receipt again Find the sale. Click … → Print receipt. In Order Receipt, use Print (P) to print. Choose the right printer and follow the print window. Use PDF for the PDF action, or TXT to save a simple text copy, when needed. You can also click Print receipt inside View details. Printing again does not create a second sale. Closing the print window does not cancel the sale. Return money for returned items Find the original sale. Click … → Refund. Check the item and Refundable number. It shows how many can still be returned. Enter only the number the customer is returning. Leave other lines at 0. Add a Reason if useful. Check Refund total. Click Confirm refund once and wait for confirmation. Check the order's new status. Handle the real money return through your shop's process, once only. Example: The customer bought three items at 200 BDT each and returns one. The refund is 200 BDT, not 600 BDT. The form does not let you choose a different payment method. A recorded refund is not an automatic bKash, Nagad, or bank transfer. Remember Check the actual returned items and amount. If the sale or refund is not available to you, ask Admin rather than making a new sale to adjust it."
    },
    {
      "id": "5-shifts--start-and-finish-your-cash-count",
      "number": 5,
      "title": "Shifts — start and finish your cash count",
      "fullTitle": "5. Shifts — start and finish your cash count",
      "blocks": [
        {
          "type": "callout",
          "label": "Open:",
          "text": "Left menu → **Shifts**. Page heading: **Shift Operations**."
        },
        {
          "type": "paragraph",
          "text": "A **shift** is a record of your working time and drawer cash. You can see the active shift, cash numbers, your advances, and shift history on this page."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "A. Open a shift"
        },
        {
          "type": "steps",
          "items": [
            "Count the cash already in your drawer before you start.",
            "Click **Open shift**.",
            "Enter that amount in **Opening float (BDT)**.",
            "Click **Open shift** in the box.",
            "Wait for **OPEN** in **Active Shift**. Check the starting amount."
          ]
        },
        {
          "type": "example",
          "label": "Example:",
          "text": "You start with 3,000 BDT for change. Enter **3000**. This is starting cash, not a sale or a salary."
        },
        {
          "type": "remember",
          "text": "Enter the cash you actually counted. Do not add today's sales to the opening amount."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "B. An old shift was left open"
        },
        {
          "type": "paragraph",
          "text": "The open-shift form has a checkbox with this text: **Reconcile and auto-close a shift left open on a previous Dhaka calendar day. Same-day active shifts cannot be replaced.** This means the app can close an old day's open shift before starting the new one. It is not for opening a second shift over today's active shift."
        },
        {
          "type": "remember",
          "text": "Ask Admin before using this for an old shift you have not checked. Closing an old record does not count yesterday's cash for you."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "C. Read your shift numbers"
        },
        {
          "type": "table",
          "headers": [
            "Box",
            "Simple meaning"
          ],
          "rows": [
            [
              "**Opening float**",
              "Cash counted at the start."
            ],
            [
              "**Cash sales**",
              "The cash-sales figure recorded for this shift."
            ],
            [
              "**Advances out**",
              "Salary advance cash recorded against this shift."
            ],
            [
              "**Expected cash**",
              "What the app expects in the drawer from recorded shift activity."
            ]
          ]
        },
        {
          "type": "example",
          "label": "Example, with no refunds or other movements:",
          "text": "Starting cash 3,000 + cash sales 160 − advances 670 = **2,490 BDT expected cash**."
        },
        {
          "type": "paragraph",
          "text": "Cash refunds can also affect the expected cash. bKash, Nagad, and bank money are not notes in your drawer. Sales or advances made without this shift are not automatically all included in this shift's numbers."
        },
        {
          "type": "remember",
          "text": "Expected cash is a guide from saved records, not proof of what is physically in the drawer. Count the notes yourself."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "D. Close your shift"
        },
        {
          "type": "steps",
          "items": [
            "Finish or check any waiting sale, refund, or advance first.",
            "Count the real cash left in the drawer.",
            "Click **Close shift**.",
            "Enter the amount in **Counted cash (BDT)**.",
            "Add **Closing notes** if useful, especially if the amount differs from the screen.",
            "Click **Close shift** once. Wait for confirmation.",
            "Check **Shift History** for the closed time and cash difference."
          ]
        },
        {
          "type": "example",
          "label": "Example:",
          "text": "Expected cash is 2,490 BDT, but you count 2,400 BDT. Enter **2400**. The difference is **−90 BDT**: the drawer is 90 BDT short. Tell Admin and add a clear note."
        },
        {
          "type": "remember",
          "text": "Do not copy the expected amount just to make the difference zero. Enter the real count."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "E. Read Shift History"
        },
        {
          "type": "paragraph",
          "text": "Each row shows who worked, the branch, opening time, closing time, starting cash, and **Variance**. **Variance** means counted cash minus expected cash. A negative number means less cash; a positive number means extra cash. A dash means no value is shown, not necessarily zero. Use **Rows** and the page arrows to see older shifts. History is for checking; opening the list does not open or close a shift."
        }
      ],
      "searchIndex": "5. Shifts — start and finish your cash count Open: Left menu → Shifts. Page heading: Shift Operations. A shift is a record of your working time and drawer cash. You can see the active shift, cash numbers, your advances, and shift history on this page. A. Open a shift Count the cash already in your drawer before you start. Click Open shift. Enter that amount in Opening float (BDT). Click Open shift in the box. Wait for OPEN in Active Shift. Check the starting amount. Example: You start with 3,000 BDT for change. Enter 3000. This is starting cash, not a sale or a salary. Remember Enter the cash you actually counted. Do not add today's sales to the opening amount. B. An old shift was left open The open-shift form has a checkbox with this text: Reconcile and auto-close a shift left open on a previous Dhaka calendar day. Same-day active shifts cannot be replaced. This means the app can close an old day's open shift before starting the new one. It is not for opening a second shift over today's active shift. Remember Ask Admin before using this for an old shift you have not checked. Closing an old record does not count yesterday's cash for you. C. Read your shift numbers Box Simple meaning Opening float Cash counted at the start. Cash sales The cash-sales figure recorded for this shift. Advances out Salary advance cash recorded against this shift. Expected cash What the app expects in the drawer from recorded shift activity. Example, with no refunds or other movements: Starting cash 3,000 + cash sales 160 − advances 670 = 2,490 BDT expected cash. Cash refunds can also affect the expected cash. bKash, Nagad, and bank money are not notes in your drawer. Sales or advances made without this shift are not automatically all included in this shift's numbers. Remember Expected cash is a guide from saved records, not proof of what is physically in the drawer. Count the notes yourself. D. Close your shift Finish or check any waiting sale, refund, or advance first. Count the real cash left in the drawer. Click Close shift. Enter the amount in Counted cash (BDT). Add Closing notes if useful, especially if the amount differs from the screen. Click Close shift once. Wait for confirmation. Check Shift History for the closed time and cash difference. Example: Expected cash is 2,490 BDT, but you count 2,400 BDT. Enter 2400. The difference is −90 BDT: the drawer is 90 BDT short. Tell Admin and add a clear note. Remember Do not copy the expected amount just to make the difference zero. Enter the real count. E. Read Shift History Each row shows who worked, the branch, opening time, closing time, starting cash, and Variance. Variance means counted cash minus expected cash. A negative number means less cash; a positive number means extra cash. A dash means no value is shown, not necessarily zero. Use Rows and the page arrows to see older shifts. History is for checking; opening the list does not open or close a shift."
    },
    {
      "id": "6-my-salary-advances--record-money-taken-early",
      "number": 6,
      "title": "My Salary Advances — record money taken early",
      "fullTitle": "6. My Salary Advances — record money taken early",
      "blocks": [
        {
          "type": "callout",
          "label": "Open:",
          "text": "**Shifts** → **3. My Salary Advances**."
        },
        {
          "type": "paragraph",
          "text": "An advance is salary money you take before the salary payment. It is kept in your advance list and taken away from the amount paid in payroll."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Record an advance"
        },
        {
          "type": "steps",
          "items": [
            "Click **Request advance**.",
            "In **Request Salary Advance**, enter **Advance Amount (BDT)**.",
            "Add a short **Reason**, such as “Family need”, if useful.",
            "Check the amount and click **Submit Request** once.",
            "Wait for success. Check the amount, reason, date, and status in **My Salary Advances**."
          ]
        },
        {
          "type": "paragraph",
          "text": "The button says “Request”, but this app records the advance directly. There is no separate in-app approval step. You do not need an open shift to record it. Record the actual money taken through your shop's process. This button does not send money to your phone or bank."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "What the status means"
        },
        {
          "type": "table",
          "headers": [
            "Status",
            "Meaning"
          ],
          "rows": [
            [
              "**PENDING**",
              "Some or all of this advance still needs to be taken away from salary. It does not mean “waiting for Admin approval”."
            ],
            [
              "**DEDUCTED / SETTLED**",
              "The advance is marked as handled through salary."
            ],
            [
              "**VOIDED**",
              "The record was cancelled. The old amount may appear crossed out."
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "Your table shows the original advance amount. Admin can check the detailed deducted and remaining amounts in Payroll. Do not assume a **PENDING** badge means nothing has been deducted yet."
        },
        {
          "type": "example",
          "label": "Example:",
          "text": "Salary is 25,000 BDT. Advances are 150 BDT and 520 BDT. Total advance is **670 BDT**. If those are the advances applied to that payroll, the salary payment is **24,330 BDT**."
        },
        {
          "type": "paragraph",
          "text": "If the advance is too large to take away from one month's salary, an amount can remain for a later salary payment. Ask Admin to explain your remaining balance."
        },
        {
          "type": "remember",
          "text": "Check the amount before submitting. If you entered a wrong advance, tell Admin; do not add another advance to try to cancel it."
        }
      ],
      "searchIndex": "6. My Salary Advances — record money taken early Open: Shifts → 3. My Salary Advances. An advance is salary money you take before the salary payment. It is kept in your advance list and taken away from the amount paid in payroll. Record an advance Click Request advance. In Request Salary Advance, enter Advance Amount (BDT). Add a short Reason, such as “Family need”, if useful. Check the amount and click Submit Request once. Wait for success. Check the amount, reason, date, and status in My Salary Advances. The button says “Request”, but this app records the advance directly. There is no separate in-app approval step. You do not need an open shift to record it. Record the actual money taken through your shop's process. This button does not send money to your phone or bank. What the status means Status Meaning PENDING Some or all of this advance still needs to be taken away from salary. It does not mean “waiting for Admin approval”. DEDUCTED / SETTLED The advance is marked as handled through salary. VOIDED The record was cancelled. The old amount may appear crossed out. Your table shows the original advance amount. Admin can check the detailed deducted and remaining amounts in Payroll. Do not assume a PENDING badge means nothing has been deducted yet. Example: Salary is 25,000 BDT. Advances are 150 BDT and 520 BDT. Total advance is 670 BDT. If those are the advances applied to that payroll, the salary payment is 24,330 BDT. If the advance is too large to take away from one month's salary, an amount can remain for a later salary payment. Ask Admin to explain your remaining balance. Remember Check the amount before submitting. If you entered a wrong advance, tell Admin; do not add another advance to try to cancel it."
    },
    {
      "id": "7-when-something-goes-wrong",
      "number": 7,
      "title": "When something goes wrong",
      "fullTitle": "7. When something goes wrong",
      "blocks": [
        {
          "type": "heading",
          "level": 3,
          "text": "The page is empty or will not load"
        },
        {
          "type": "paragraph",
          "text": "Check your internet connection. Clear search and filters. Use **Retry** on the loading error. Check with Admin if your branch or account is wrong."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "A price changed at checkout"
        },
        {
          "type": "paragraph",
          "text": "Check the new price with the customer. Check the ticket total and cash received again. Then complete the same corrected ticket. Do not complete a second copy of the sale."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "I clicked Complete sale, but no receipt appeared"
        },
        {
          "type": "paragraph",
          "text": "A lost reply does not always mean the sale failed."
        },
        {
          "type": "steps",
          "items": [
            "Stop. Do not type the same sale again as a new ticket.",
            "Open **Orders** and check whether the bill was saved.",
            "If the screen offers **Retry exact ticket**, **Retry completion**, or **Retry same sale**, use that saved retry without changing the items or amount.",
            "If you still cannot tell what happened, ask Admin. Give the time, items, and amount."
          ]
        },
        {
          "type": "heading",
          "level": 3,
          "text": "A refund result is unclear"
        },
        {
          "type": "paragraph",
          "text": "Check the order details and its refund status. Reopen that refund if needed. Use **Retry uncertain refund** only for that same saved action. Do not give the customer the money twice."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "An advance result is unclear"
        },
        {
          "type": "paragraph",
          "text": "Check **My Salary Advances** for the amount and time. Use **Review Request**, or reopen **Request advance**, to view the saved request. Use **Retry exact request** when shown, without changing its amount or reason. Do not record a new advance just because the first reply was slow."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "A shift open or close result is unclear"
        },
        {
          "type": "paragraph",
          "text": "Check **Active Shift** and **Shift History**. Use **Review & Retry Open**, **Review & Retry Close**, or the **Review uncertain shift** button when shown. Read the saved amount and click **Retry same operation** if appropriate. An old close warning can remain even after **Active Shift** disappears. Check its history; do not open a new shift just to remove the warning."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "What does Clear lock mean?"
        },
        {
          "type": "paragraph",
          "text": "You may see **Reconciled (Clear)**, **I checked history (Clear lock)**, or **Verified in ledger (Clear lock)**. These remove a warning lock. They do not return money, remove a sale, or cancel a salary advance."
        },
        {
          "type": "remember",
          "text": "Ask Admin before clearing an unclear money action. A missing row on a slow or still-loading page is not proof that nothing was saved."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Internet is down"
        },
        {
          "type": "paragraph",
          "text": "Restore the connection before continuing. An unsaved or held ticket is not a confirmed sale. Do not promise a completed bill until the app confirms it."
        }
      ],
      "searchIndex": "7. When something goes wrong The page is empty or will not load Check your internet connection. Clear search and filters. Use Retry on the loading error. Check with Admin if your branch or account is wrong. A price changed at checkout Check the new price with the customer. Check the ticket total and cash received again. Then complete the same corrected ticket. Do not complete a second copy of the sale. I clicked Complete sale, but no receipt appeared A lost reply does not always mean the sale failed. Stop. Do not type the same sale again as a new ticket. Open Orders and check whether the bill was saved. If the screen offers Retry exact ticket, Retry completion, or Retry same sale, use that saved retry without changing the items or amount. If you still cannot tell what happened, ask Admin. Give the time, items, and amount. A refund result is unclear Check the order details and its refund status. Reopen that refund if needed. Use Retry uncertain refund only for that same saved action. Do not give the customer the money twice. An advance result is unclear Check My Salary Advances for the amount and time. Use Review Request, or reopen Request advance, to view the saved request. Use Retry exact request when shown, without changing its amount or reason. Do not record a new advance just because the first reply was slow. A shift open or close result is unclear Check Active Shift and Shift History. Use Review & Retry Open, Review & Retry Close, or the Review uncertain shift button when shown. Read the saved amount and click Retry same operation if appropriate. An old close warning can remain even after Active Shift disappears. Check its history; do not open a new shift just to remove the warning. What does Clear lock mean? You may see Reconciled (Clear), I checked history (Clear lock), or Verified in ledger (Clear lock). These remove a warning lock. They do not return money, remove a sale, or cancel a salary advance. Remember Ask Admin before clearing an unclear money action. A missing row on a slow or still-loading page is not proof that nothing was saved. Internet is down Restore the connection before continuing. An unsaved or held ticket is not a confirmed sale. Do not promise a completed bill until the app confirms it."
    },
    {
      "id": "8-end-of-work",
      "number": 8,
      "title": "End of work",
      "fullTitle": "8. End of work",
      "blocks": [
        {
          "type": "steps",
          "items": [
            "Check that no sale, refund, shift, or advance result is still unclear.",
            "Finish or deal with held tickets. A held ticket is not paid.",
            "Count the drawer and close your shift if one is open.",
            "Tell Admin about any cash difference, wrong stock, or other problem.",
            "Click **Sign out** in the menu or the exit picture near your name."
          ]
        },
        {
          "type": "remember",
          "text": "Closing a shift and signing out are different actions. Do not assume that signing out closes your shift."
        }
      ],
      "searchIndex": "8. End of work Check that no sale, refund, shift, or advance result is still unclear. Finish or deal with held tickets. A held ticket is not paid. Count the drawer and close your shift if one is open. Tell Admin about any cash difference, wrong stock, or other problem. Click Sign out in the menu or the exit picture near your name. Remember Closing a shift and signing out are different actions. Do not assume that signing out closes your shift."
    },
    {
      "id": "9-simple-word-guide",
      "number": 9,
      "title": "Simple word guide",
      "fullTitle": "9. Simple word guide",
      "blocks": [
        {
          "type": "table",
          "headers": [
            "Word",
            "Meaning"
          ],
          "rows": [
            [
              "**BDT**",
              "Taka."
            ],
            [
              "**Branch**",
              "Your shop location."
            ],
            [
              "**Category**",
              "A group of items."
            ],
            [
              "**Variant**",
              "One exact kind, size, or colour of an item."
            ],
            [
              "**SKU**",
              "An item code."
            ],
            [
              "**Quantity**",
              "How many."
            ],
            [
              "**Ticket**",
              "The item list you are preparing for a customer."
            ],
            [
              "**Order**",
              "The saved sale record."
            ],
            [
              "**Receipt / Invoice**",
              "The bill / its number."
            ],
            [
              "**Walk-in Customer**",
              "A sale with no customer name entered."
            ],
            [
              "**Exact**",
              "Fill in the same cash amount as the bill total."
            ],
            [
              "**Change**",
              "Cash you give back."
            ],
            [
              "**Paid**",
              "Recorded as paid."
            ],
            [
              "**Refund**",
              "Record money returned for a sale."
            ],
            [
              "**Opening float**",
              "Cash in the drawer at the start."
            ],
            [
              "**Counted cash**",
              "Cash you actually counted."
            ],
            [
              "**Expected cash**",
              "Cash the app expects from the recorded shift activity."
            ],
            [
              "**Variance**",
              "Extra or missing cash compared with the expected amount."
            ],
            [
              "**Advance**",
              "Salary money taken early."
            ],
            [
              "**Deducted**",
              "Taken away from salary."
            ],
            [
              "**Optional**",
              "You may leave it empty."
            ],
            [
              "**Uncertain**",
              "The app does not yet know whether the action finished."
            ]
          ]
        }
      ],
      "searchIndex": "9. Simple word guide Word Meaning BDT Taka. Branch Your shop location. Category A group of items. Variant One exact kind, size, or colour of an item. SKU An item code. Quantity How many. Ticket The item list you are preparing for a customer. Order The saved sale record. Receipt / Invoice The bill / its number. Walk-in Customer A sale with no customer name entered. Exact Fill in the same cash amount as the bill total. Change Cash you give back. Paid Recorded as paid. Refund Record money returned for a sale. Opening float Cash in the drawer at the start. Counted cash Cash you actually counted. Expected cash Cash the app expects from the recorded shift activity. Variance Extra or missing cash compared with the expected amount. Advance Salary money taken early. Deducted Taken away from salary. Optional You may leave it empty. Uncertain The app does not yet know whether the action finished."
    }
  ]
};
