import { useState } from "react";
import { Copy, Check, CheckCircle2, AlertTriangle, Play, HelpCircle } from "lucide-react";

export const APPS_SCRIPT_CODE = `// =========================================================================
//  GIFTED FOOD ORDER SYSTEM - GOOGLE APPS SCRIPT BACKEND
//  Paste this code into Extensions -> Apps Script in your Google Spreadsheet.
//  Deploy as a Web App: Execute as "Me", Who has access "Anyone".
// =========================================================================

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!sheet) {
    return createJSONResponse({ error: "Spreadsheet context not found. Make sure this is a container-bound script created under Extensions -> Apps Script." });
  }

  // Automatically initialize sheets if they do not exist
  initSheets(sheet);

  if (!e || !e.parameter || !e.parameter.action) {
    return createJSONResponse({ 
      status: "online", 
      message: "BiteSync Google Sheets API is live and connected. Ready to serve food items and orders!" 
    });
  }

  var action = e.parameter.action;
  
  if (action === "getMenu") {
    return getMenuData(sheet);
  } else if (action === "getOrders") {
    return getOrdersData(sheet);
  } else if (action === "getFeedback") {
    return getFeedbackData(sheet);
  }
  
  return createJSONResponse({ error: "Invalid action parameter: " + action });
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!sheet) {
    return createJSONResponse({ error: "Spreadsheet context not found." });
  }

  initSheets(sheet);

  var postData;
  if (!e || !e.postData || !e.postData.contents) {
    return createJSONResponse({ error: "Missing POST body content" });
  }

  try {
    postData = JSON.parse(e.postData.contents);
  } catch (err) {
    return createJSONResponse({ error: "Invalid JSON body: " + err.message });
  }
  
  var action = postData.action;
  
  if (action === "saveMenuItem") {
    return saveMenuItem(sheet, postData.item);
  } else if (action === "deleteMenuItem") {
    return deleteMenuItem(sheet, postData.id);
  } else if (action === "createOrder") {
    return createOrder(sheet, postData.order);
  } else if (action === "updateOrderStatus") {
    return updateOrderStatus(sheet, postData.id, postData.status);
  } else if (action === "saveFeedback") {
    return saveFeedbackItem(sheet, postData.feedback);
  } else if (action === "deleteFeedback") {
    return deleteFeedbackItem(sheet, postData.id);
  }
  
  return createJSONResponse({ error: "Invalid action: " + action });
}

// Ensure the sheets exist and have appropriate headers
function initSheets(sheet) {
  var menuSheet = sheet.getSheetByName("menu");
  if (!menuSheet) {
    menuSheet = sheet.insertSheet("menu");
    menuSheet.appendRow(["id", "name", "description", "price", "category", "image", "available"]);
    // Freeze header row
    menuSheet.setFrozenRows(1);
    
    // Seed some initial delicious items to start with (Indian Rupees)
    var initialItems = [
      ["m1", "Paneer Butter Masala", "Creamy cottage cheese cubes in a rich, spiced tomato-butter gravy with fresh cream.", "280.00", "Mains", "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80", "true"],
      ["m2", "Butter Chicken (Murgh Makhani)", "Succulent clay-oven tandoori chicken pieces simmered in a creamy, buttery spiced tomato curry.", "340.00", "Mains", "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80", "true"],
      ["m3", "Crispy Samosa Platter", "Golden fried flaky pastries stuffed with spiced potatoes and peas, served with sweet tamarind and spicy mint chutneys.", "110.00", "Starters", "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=80", "true"],
      ["m5", "Warm Gulab Jamun", "Two classic soft milk-solid dumplings fried golden and soaked in hot rose and cardamom-infused sugar syrup.", "90.00", "Desserts", "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80", "true"]
    ];
    for (var i = 0; i < initialItems.length; i++) {
      menuSheet.appendRow(initialItems[i]);
    }
  }
  
  var ordersSheet = sheet.getSheetByName("orders");
  if (!ordersSheet) {
    ordersSheet = sheet.insertSheet("orders");
    ordersSheet.appendRow(["id", "customerName", "customerPhone", "deliveryAddress", "notes", "items", "total", "status", "timestamp"]);
    ordersSheet.setFrozenRows(1);
  }

  var feedbackSheet = sheet.getSheetByName("feedback");
  if (!feedbackSheet) {
    feedbackSheet = sheet.insertSheet("feedback");
    feedbackSheet.appendRow(["id", "customerName", "rating", "comment", "tag", "menuItemName", "timestamp"]);
    feedbackSheet.setFrozenRows(1);
    
    // Seed some initial reviews
    var initialFeedback = [
      ["f1", "Aarav Sharma", 5, "The Fiery Paneer Tikka Pizza was absolutely stellar! Crisp hand-stretched crust, loaded with spicy paneer, and hot cheese. Highly recommended!", "Tasty Food", "Fiery Paneer Tikka Pizza", new Date(Date.now() - 3600000 * 2).toISOString()],
      ["f2", "Anjali Gupta", 5, "Outstanding delivery speed! The Classic Margherita Pizza arrived incredibly fresh and warm. Kids absolutely loved it.", "Fast Delivery", "Classic Margherita Pizza", new Date(Date.now() - 3600000 * 5).toISOString()],
      ["f3", "Rohan Das", 4, "Creamy Alfredo Pasta is perfectly rich, buttery, and garlic-flavored. Samosas were also extremely crunchy. Amazing food quality!", "Tasty Food", "Creamy Alfredo Pasta", new Date(Date.now() - 3600000 * 24).toISOString()]
    ];
    for (var i = 0; i < initialFeedback.length; i++) {
      feedbackSheet.appendRow(initialFeedback[i]);
    }
  }
}

// Fetch all menu items
function getMenuData(sheet) {
  var menuSheet = sheet.getSheetByName("menu");
  var rows = menuSheet.getDataRange().getValues();
  var headers = rows[0];
  var data = [];
  
  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    var item = {};
    for (var c = 0; c < headers.length; c++) {
      var val = row[c];
      // Type conversions
      if (headers[c] === "price") val = parseFloat(val) || 0;
      if (headers[c] === "available") val = (String(val).toLowerCase() === "true");
      item[headers[c]] = val;
    }
    data.push(item);
  }
  return createJSONResponse({ menu: data });
}

// Fetch all orders
function getOrdersData(sheet) {
  var ordersSheet = sheet.getSheetByName("orders");
  var rows = ordersSheet.getDataRange().getValues();
  var headers = rows[0];
  var data = [];
  
  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    var order = {};
    for (var c = 0; c < headers.length; c++) {
      var val = row[c];
      if (headers[c] === "total") val = parseFloat(val) || 0;
      if (headers[c] === "items") {
        try {
          val = JSON.parse(val);
        } catch (e) {
          val = [];
        }
      }
      order[headers[c]] = val;
    }
    data.push(order);
  }
  return createJSONResponse({ orders: data });
}

// Fetch all feedback items
function getFeedbackData(sheet) {
  var feedbackSheet = sheet.getSheetByName("feedback");
  if (!feedbackSheet) {
    return createJSONResponse({ feedback: [] });
  }
  var rows = feedbackSheet.getDataRange().getValues();
  var headers = rows[0];
  var data = [];
  
  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    var item = {};
    for (var c = 0; c < headers.length; c++) {
      var val = row[c];
      if (headers[c] === "rating") val = parseInt(val) || 5;
      item[headers[c]] = val;
    }
    data.push(item);
  }
  return createJSONResponse({ feedback: data });
}

// Save (Add or Edit) a menu item
function saveMenuItem(sheet, item) {
  var menuSheet = sheet.getSheetByName("menu");
  var rows = menuSheet.getDataRange().getValues();
  var headers = rows[0];
  
  var idIndex = headers.indexOf("id");
  var foundRowIndex = -1;
  
  for (var r = 1; r < rows.length; r++) {
    if (String(rows[r][idIndex]) === String(item.id)) {
      foundRowIndex = r + 1; // 1-based index for sheets
      break;
    }
  }
  
  var rowValues = headers.map(function(h) {
    var val = item[h];
    if (h === "available") val = String(val);
    if (h === "price") val = parseFloat(val) || 0;
    return val !== undefined ? val : "";
  });
  
  if (foundRowIndex !== -1) {
    // Update existing row
    var range = menuSheet.getRange(foundRowIndex, 1, 1, headers.length);
    range.setValues([rowValues]);
  } else {
    // Append new row
    menuSheet.appendRow(rowValues);
  }
  
  return createJSONResponse({ success: true, item: item });
}

// Delete a menu item
function deleteMenuItem(sheet, id) {
  var menuSheet = sheet.getSheetByName("menu");
  var rows = menuSheet.getDataRange().getValues();
  var headers = rows[0];
  var idIndex = headers.indexOf("id");
  
  for (var r = 1; r < rows.length; r++) {
    if (String(rows[r][idIndex]) === String(id)) {
      menuSheet.deleteRow(r + 1);
      return createJSONResponse({ success: true, deletedId: id });
    }
  }
  return createJSONResponse({ error: "Item not found with ID: " + id });
}

// Append a new order
function createOrder(sheet, order) {
  var ordersSheet = sheet.getSheetByName("orders");
  var headers = ordersSheet.getDataRange().getValues()[0];
  
  var rowValues = headers.map(function(h) {
    var val = order[h];
    if (h === "items") val = JSON.stringify(order.items);
    if (h === "total") val = parseFloat(val) || 0;
    return val !== undefined ? val : "";
  });
  
  ordersSheet.appendRow(rowValues);
  return createJSONResponse({ success: true, order: order });
}

// Update status of an existing order
function updateOrderStatus(sheet, id, status) {
  var ordersSheet = sheet.getSheetByName("orders");
  var rows = ordersSheet.getDataRange().getValues();
  var headers = rows[0];
  var idIndex = headers.indexOf("id");
  var statusIndex = headers.indexOf("status");
  
  for (var r = 1; r < rows.length; r++) {
    if (String(rows[r][idIndex]) === String(id)) {
      ordersSheet.getRange(r + 1, statusIndex + 1).setValue(status);
      return createJSONResponse({ success: true, id: id, status: status });
    }
  }
  return createJSONResponse({ error: "Order not found with ID: " + id });
}

// Save (Add or Edit) feedback
function saveFeedbackItem(sheet, feedback) {
  var feedbackSheet = sheet.getSheetByName("feedback");
  var rows = feedbackSheet.getDataRange().getValues();
  var headers = rows[0];
  
  var idIndex = headers.indexOf("id");
  var foundRowIndex = -1;
  
  for (var r = 1; r < rows.length; r++) {
    if (String(rows[r][idIndex]) === String(feedback.id)) {
      foundRowIndex = r + 1; // 1-based index
      break;
    }
  }
  
  var rowValues = headers.map(function(h) {
    var val = feedback[h];
    if (h === "rating") val = parseInt(val) || 5;
    return val !== undefined ? val : "";
  });
  
  if (foundRowIndex !== -1) {
    var range = feedbackSheet.getRange(foundRowIndex, 1, 1, headers.length);
    range.setValues([rowValues]);
  } else {
    feedbackSheet.appendRow(rowValues);
  }
  
  return createJSONResponse({ success: true, feedback: feedback });
}

// Delete feedback
function deleteFeedbackItem(sheet, id) {
  var feedbackSheet = sheet.getSheetByName("feedback");
  var rows = feedbackSheet.getDataRange().getValues();
  var headers = rows[0];
  var idIndex = headers.indexOf("id");
  
  for (var r = 1; r < rows.length; r++) {
    if (String(rows[r][idIndex]) === String(id)) {
      feedbackSheet.deleteRow(r + 1);
      return createJSONResponse({ success: true, deletedId: id });
    }
  }
  return createJSONResponse({ error: "Feedback not found with ID: " + id });
}

// Help resolve CORS and JSON formatting for fetch() calls
function createJSONResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

interface AppsScriptSetupProps {
  webAppUrl: string;
  onSaveUrl: (url: string) => void;
  onTestConnection: () => Promise<boolean>;
}

export default function AppsScriptSetup({
  webAppUrl,
  onSaveUrl,
  onTestConnection,
}: AppsScriptSetupProps) {
  const [urlInput, setUrlInput] = useState(webAppUrl);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'failed'>('idle');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleSave = () => {
    onSaveUrl(urlInput.trim());
  };

  const handleTest = async () => {
    if (!urlInput.trim()) return;
    setTesting(true);
    setTestResult('idle');
    try {
      const ok = await onTestConnection();
      setTestResult(ok ? 'success' : 'failed');
    } catch (err) {
      setTestResult('failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div id="apps-script-setup-container" className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-vibrant-border pb-5">
        <h1 className="text-2xl font-black tracking-tight text-vibrant-slate">Google Sheets Integration Setup</h1>
        <p className="mt-2 text-sm text-vibrant-gray font-semibold">
          Turn a standard Google Spreadsheet into a fully operational cloud database for your menu items and incoming orders.
        </p>
      </div>

      {/* Connection Panel */}
      <div className="bg-white border-2 border-vibrant-border rounded-3xl p-6 shadow-md hover:shadow-lg transition-all">
        <h2 className="text-base font-black text-vibrant-slate mb-4 flex items-center gap-2">
          <Play className="w-4 h-4 text-vibrant-orange fill-vibrant-orange/20" />
          1. Connect Web App URL
        </h2>
        <p className="text-sm text-vibrant-gray font-semibold mb-4">
          Once you complete the instructions below and deploy your Google Apps Script, paste the resulting <strong>Web App URL</strong> here:
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="web-app-url-input"
            type="text"
            className="flex-1 px-4 py-2.5 border border-vibrant-border rounded-xl text-sm focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange bg-vibrant-peach/30 outline-none transition-all"
            placeholder="https://script.google.com/macros/s/.../exec"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              id="save-url-btn"
              onClick={handleSave}
              disabled={!urlInput.trim()}
              className="px-5 py-2.5 bg-vibrant-orange hover:bg-vibrant-orange-dark text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-vibrant-orange/15"
            >
              Save URL
            </button>
            <button
              id="test-url-btn"
              onClick={handleTest}
              disabled={testing || !urlInput.trim()}
              className="px-4 py-2.5 bg-vibrant-peach text-vibrant-orange-dark hover:bg-vibrant-orange/15 rounded-xl text-sm font-bold border border-vibrant-border transition-all flex items-center gap-1.5"
            >
              {testing ? "Testing..." : "Test Connection"}
            </button>
          </div>
        </div>

        {testResult === 'success' && (
          <div className="mt-4 p-4 bg-emerald-50 text-emerald-950 font-semibold rounded-2xl text-sm flex items-center gap-3 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Connection Successful! The database is sync-ready and communicating properly.</span>
          </div>
        )}
        {testResult === 'failed' && (
          <div className="mt-4 p-4 bg-rose-50 text-rose-950 font-semibold rounded-2xl text-sm flex items-center gap-3 border border-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Connection Failed. Make sure the deployment was authorized and the URL is copied accurately.</span>
          </div>
        )}
        {!webAppUrl && testResult === 'idle' && (
          <div className="mt-4 p-4 bg-[#FFEE93]/35 text-vibrant-orange-dark font-bold rounded-2xl text-sm flex items-center gap-3 border border-vibrant-border">
            <HelpCircle className="w-5 h-5 text-vibrant-orange shrink-0" />
            <span>Currently in <strong>Fallback Mode</strong>. The app is fully operational using secure local state, but updates won't persist to a Spreadsheet until connected.</span>
          </div>
        )}
      </div>

      {/* Step by Step Guide */}
      <div className="bg-white border-2 border-vibrant-border rounded-3xl p-6 shadow-md hover:shadow-lg transition-all space-y-6">
        <h2 className="text-base font-black text-vibrant-slate flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-vibrant-orange" />
          2. Step-by-Step Google Sheet Configuration Guide
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-vibrant-gray">
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-vibrant-peach text-vibrant-orange-dark text-xs font-black shrink-0 border border-vibrant-border">1</span>
              <div>
                <p className="font-bold text-vibrant-slate">Create a Google Spreadsheet</p>
                <p className="text-xs text-vibrant-gray font-semibold mt-0.5">Go to <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-vibrant-orange hover:underline font-bold">sheets.new</a> and create a blank spreadsheet. You can name it whatever you like (e.g. <em>BiteSync Food Order Database</em>).</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-vibrant-peach text-vibrant-orange-dark text-xs font-black shrink-0 border border-vibrant-border">2</span>
              <div>
                <p className="font-bold text-vibrant-slate">Open Apps Script Editor</p>
                <p className="text-xs text-vibrant-gray font-semibold mt-0.5">In the top menu, select <strong>Extensions</strong> &rarr; <strong>Apps Script</strong>. This opens the script coding editor in a new browser tab.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-vibrant-peach text-vibrant-orange-dark text-xs font-black shrink-0 border border-vibrant-border">3</span>
              <div>
                <p className="font-bold text-vibrant-slate">Paste Backend Code</p>
                <p className="text-xs text-vibrant-gray font-semibold mt-0.5">Delete any code inside the default file (usually <code>Code.gs</code>) and paste the entire script shown on the right side.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-vibrant-peach text-vibrant-orange-dark text-xs font-black shrink-0 border border-vibrant-border">4</span>
              <div>
                <p className="font-bold text-vibrant-slate">Deploy as Web App</p>
                <p className="text-xs text-vibrant-gray font-semibold mt-0.5">Click <strong>Deploy</strong> (top-right) &rarr; <strong>New deployment</strong>. Select the <strong>Gear icon</strong> next to Select type, then choose <strong>Web app</strong>.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-vibrant-peach text-vibrant-orange-dark text-xs font-black shrink-0 border border-vibrant-border">5</span>
              <div>
                <p className="font-bold text-vibrant-slate">Configure Permissions</p>
                <p className="text-xs text-vibrant-gray font-semibold mt-0.5">Set <strong>Execute as</strong> to <strong>Me (your email)</strong>, and set <strong>Who has access</strong> to <strong>Anyone</strong>. <em>(This is required to allow incoming orders from your customers).</em></p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-vibrant-peach text-vibrant-orange-dark text-xs font-black shrink-0 border border-vibrant-border">6</span>
              <div>
                <p className="font-bold text-vibrant-slate">Authorize & Copy URL</p>
                <p className="text-xs text-vibrant-gray font-semibold mt-0.5">Click <strong>Deploy</strong>. Google will prompt you to authorize permissions. Click "Allow", then copy the generated <strong>Web app URL</strong> and paste it in Section 1 above.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="bg-gray-900 rounded-xl overflow-hidden shadow-md">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-950 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-xs font-mono text-gray-400 ml-2">Code.gs</span>
          </div>
          <button
            id="copy-script-code-btn"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 bg-gray-850 hover:bg-gray-800 text-gray-300 rounded-md text-xs font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Apps Script Code
              </>
            )}
          </button>
        </div>
        <div className="p-5 overflow-auto max-h-[400px] text-xs font-mono text-gray-300 leading-relaxed bg-gray-900/90 scrollbar-thin">
          <pre>{APPS_SCRIPT_CODE}</pre>
        </div>
      </div>
    </div>
  );
}
