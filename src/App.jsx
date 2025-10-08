
import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import * as XLSX from "xlsx";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [shipment, setShipment] = useState([]);
  const [miscellaneous, setMiscellaneous] = useState([]); 

  // Automatically choose backend based on environment
const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://warehouse-blush-nine.vercel.app/api");


  // --- Sync helpers: Send data to backend Neon DB ---
const saveScheduleToDB = async (scheduleData) => {
  try {
    await fetch(`${API_URL}/schedule/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: scheduleData }),
    });
    console.log("✅ Schedule saved to Neon DB");
  } catch (err) {
    console.error("❌ Failed to save schedule to Neon:", err);
  }
};

const saveShipmentToDB = async (shipmentData) => {
  try {
    await fetch(`${API_URL}/shipment/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: shipmentData }),
    });
    console.log("✅ Shipment saved to Neon DB");
  } catch (err) {
    console.error("❌ Failed to save shipment to Neon:", err);
  }
};

// Save Miscellaneous to Neon
const saveMiscellaneousToDB = async (miscData) => {
  try {
    await fetch(`${API_URL}/miscellaneous/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: miscData }),
    });
    console.log("✅ Miscellaneous saved to Neon");
  } catch (err) {
    console.error("❌ Failed to save miscellaneous:", err);
  }
};



  // ✅ Updated handleLogin (checks DB users)
  const handleLogin = () => {
    const foundUser = users.find(
      (u) => u.username === username && u.password === password
    );

    if (foundUser) {
      setUser(foundUser);
      setError("");
    } else {
      setError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsername("");
    setPassword("");
  };

 // Sync Users
useEffect(() => {
  fetch(`${API_URL}/users`)
    .then(res => res.json())
    .then(data => {
      if (data?.length) setUsers(data);
    });
}, []);

useEffect(() => {
  if (users.length) {
    fetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(users[users.length - 1]) // send only last/new user
    });
  }
}, [users]);

// Sync Schedule
useEffect(() => {
  fetch(`${API_URL}/schedule`)
    .then(res => res.json())
    .then(data => {
      if (data?.length) setSchedule(data.map(r => r.data));
    });
}, []);

// ✅ REPLACE your old POST schedule useEffect with this:
useEffect(() => {
  if (schedule.length) {
    fetch(`${API_URL}/schedule/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: schedule }),
    })
      .then(res => res.json())
      .then(result => console.log("✅ Schedule saved:", result))
      .catch(err => console.error("❌ Error saving schedule:", err));
  }
}, [schedule]);

// Sync Shipment
useEffect(() => {
  fetch(`${API_URL}/shipment`)
    .then(res => res.json())
    .then(data => {
      if (data?.length) setShipment(data.map(r => r.data));
    });
}, []);

// ✅ REPLACE your old POST shipment useEffect with this:
useEffect(() => {
  if (shipment.length) {
    fetch(`${API_URL}/shipment/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: shipment }),
    })
      .then(res => res.json())
      .then(result => console.log("✅ Shipment saved:", result))
      .catch(err => console.error("❌ Error saving shipment:", err));
  }
}, [shipment]);

// Sync Miscellaneous
useEffect(() => {
  fetch(`${API_URL}/miscellaneous`)
    .then(res => res.json())
    .then(data => {
      if (data?.length) setMiscellaneous(data.map(r => r.data));
    });
}, []);

useEffect(() => {
  if (miscellaneous.length) {
    fetch(`${API_URL}/miscellaneous`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: miscellaneous })
    });
  }
}, [miscellaneous]);
 
  // ---------------- Data ----------------
  
  const [summaryData, setSummaryData] = useState([]);

  const [scheduleSearch, setScheduleSearch] = useState("");
  const [shipmentSearch, setShipmentSearch] = useState("");
  const [miscSearch, setMiscSearch] = useState("");
  const [activeTab, setActiveTab] = useState("schedule");

  const [summarySearch, setSummarySearch] = useState("");
  const [summaryFrom, setSummaryFrom] = useState("");
  const [summaryTo, setSummaryTo] = useState("");


  // ---------------- Permissions ----------------
  const role = user?.role;
  const canModifySchedule = role === "admin" || role === "supervisor";
  const canModifyShipment = ["admin", "supervisor", "team-leader", "operator"].includes(role);
  const canManageUsers = role === "admin";

  // ---------------- Excel ----------------
  const excelDateToDDMMYY = (excelDate) => {
    if (!excelDate) return "";
    if (typeof excelDate === "string") return excelDate;
    const date = XLSX.SSF.parse_date_code(excelDate);
    if (!date) return "";
    const jsDate = new Date(date.y, date.m - 1, date.d);
    return jsDate.toLocaleDateString("en-GB");
  };

  const exportSchedule = () => {
    const ws = XLSX.utils.json_to_sheet(schedule);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedule");
    XLSX.writeFile(wb, "schedule.xlsx");
  };

  // Export Shipment
const exportShipment = () => {
  const ws = XLSX.utils.json_to_sheet(filteredShipment);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Shipment");
  XLSX.writeFile(wb, "shipment.xlsx");
};

// Export Summary (fixed)
const exportSummary = () => {
  try {
    // Build grouped summary the same way as in rendering
    const fromDate = summaryFrom ? new Date(summaryFrom) : null;
    const toDate = summaryTo ? new Date(summaryTo) : null;

    const groupMap = {};
    (schedule || []).forEach((sch) => {
      const contractNR = (sch["Contract NR"] || "").toString();
      const doNR = (sch["DO NR"] || "").toString();
      const key = `${contractNR}||${doNR}`;

      let qtyFCL = parseInt(sch["QTY (FCL)"], 10);
      if (!Number.isFinite(qtyFCL)) {
        const raw = (sch["QTY (FCL)"] || "").toString().replace(/[^\d-]/g, "");
        qtyFCL = raw ? parseInt(raw, 10) || 1 : 1;
      }

      if (!groupMap[key]) {
        groupMap[key] = {
          contractNR,
          doNR,
          productDescription: (sch["Product Description"] || "").toString(),
          buyer: (sch["Buyer"] || "").toString(),
          qtyFCL,
          completed: 0,
        };
      } else {
        groupMap[key].qtyFCL += qtyFCL;
      }
    });

    (shipment || []).forEach((s) => {
      const entryTimeStr = (s.entryTime || "").toString();
      const entryDate = entryTimeStr ? new Date(entryTimeStr) : null;

      if (fromDate && (!entryDate || entryDate < fromDate)) return;
      if (toDate && (!entryDate || entryDate > toDate)) return;

      const key = `${(s.contractNR || "").toString()}||${(s.doNR || "").toString()}`;
      if (groupMap[key] && (s.status || "").toLowerCase() === "completed") {
        groupMap[key].completed += 1;
      }
    });

    let groupedArray = Object.values(groupMap).map((g) => {
      const incomplete = Math.max(0, g.qtyFCL - g.completed);
      return { ...g, incomplete };
    });

    const search = (summarySearch || "").trim().toLowerCase();
    if (search) {
      groupedArray = groupedArray.filter((g) =>
        (g.contractNR || "").toLowerCase().includes(search) ||
        (g.doNR || "").toLowerCase().includes(search) ||
        (g.productDescription || "").toLowerCase().includes(search) ||
        (g.buyer || "").toLowerCase().includes(search)
      );
    }

    if (!groupedArray.length) {
      alert("No data to export!");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(groupedArray);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Summary");
    XLSX.writeFile(wb, "summary.xlsx");
  } catch (err) {
    console.error("Export summary error:", err);
    alert("Failed to export summary.");
  }
};


// Export Miscellaneous (Misshandling)
const exportMisc = () => {
  const data = filteredMisc.map((s) => ({
    "Contract NR": s.contractNR,
    "Product Description": s.productDescription,
    "DO NR": s.doNR,
    "Root Cause": s.misshandling?.rootCause || "",
    "QTY": s.misshandling?.qty || "",
    "Buruh": s.misshandling?.buruh || "",
    "Product ID": s.misshandling?.productid || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Misshandling");
  XLSX.writeFile(wb, "misshandling.xlsx");
};


  
  const importSchedule = (e) => {
    if (!canModifySchedule) {
      alert("You don't have permission to import schedule.");
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const wsName = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsName];
      let jsonData = XLSX.utils.sheet_to_json(ws);

      // normalize date
      jsonData = jsonData.map((row) => ({
        ...row,
        "Plan Date": excelDateToDDMMYY(row["Plan Date"]),
        "Closing Date": excelDateToDDMMYY(row["Closing Date"]),
      }));

      setSchedule(jsonData);
saveScheduleToDB(jsonData); // ⬅️ Save schedule immediately to Neon

// Build shipment rows based on QTY (FCL)
let newShipment = [];
jsonData.forEach((item) => {
  const qty = parseInt(item["QTY (FCL)"], 10) || 1;
  for (let i = 0; i < qty; i++) {
    newShipment.push({
      status: "",
      contractNR: item["Contract NR"] || "",
      productDescription: item["Product Description"] || "",
      doNR: item["DO NR"] || "",
      emkl: item["EMKL"] || "",
      buyer: item["Buyer"] || "",
      startTime: "",
      finishTime: "",
      policeNR: "",
      containerNR: "",
      sealNR: "",
      checker: "",
      buruh: "",
      misshandling: null,
      remark: "",
    });
  }
});
setShipment(newShipment);
saveShipmentToDB(newShipment); // ⬅️ Save shipment template to Neon

    };
    reader.readAsArrayBuffer(file);
  };

  
  // ---------------- Schedule editing ----------------
  const scheduleCols = [
    "Plan Date", "Warehouse NR", "Contract NR", "Product Description", "DO NR", "EMKL", "Buyer",
    "QTY (FCL)", "QTY (Shipment)", "Unit Measure", "Closing Date", "Closing Time",
    "Special Treatment", "Remark", "Product ID", "DO SAP", "SO NR"
  ];

  const linkedMap = {
    "Contract NR": "contractNR",
    "Product Description": "productDescription",
    "DO NR": "doNR",
    EMKL: "emkl",
    Buyer: "buyer",
  };

  const handleScheduleCellChange = (rowIdx, col, value) => {
    if (!canModifySchedule) return;
    const oldRow = schedule[rowIdx] || {};
    const oldVal = oldRow[col] || "";
    const newSchedule = [...schedule];
    newSchedule[rowIdx] = { ...oldRow, [col]: value };
    setSchedule(newSchedule);

    if (linkedMap[col]) {
      const fieldName = linkedMap[col];
      const newShipment = [...shipment];
      if (newShipment[rowIdx]) {
        const curShipmentValue = newShipment[rowIdx][fieldName] || "";
        if (curShipmentValue === "" || curShipmentValue === oldVal) {
          newShipment[rowIdx][fieldName] = value;
          setShipment(newShipment);
        }
      }
    }
  };

  // ---------------- Shipment editing ----------------
 const handleShipmentChange = (rowIdx, field, value) => {
  if (!canModifyShipment) return;
  const newShipment = [...shipment];
  if (!newShipment[rowIdx]) return;

  newShipment[rowIdx][field] = value;
  setShipment(newShipment);

  // ⬅️ Auto-save this shipment row to Neon after user edits
  saveShipmentToDB(newShipment);
};


  // ---------------- Misshandling modal ----------------
  const [missModalOpen, setMissModalOpen] = useState(false);
  const [missEditIndex, setMissEditIndex] = useState(null);
  const [missForm, setMissForm] = useState({ rootCause: "", qty: "", buruh: "", productid: "" });

  const openMissModal = (rowIdx) => {
    setMissEditIndex(rowIdx);
    const existing = shipment[rowIdx]?.misshandling || { rootCause: "", qty: "", buruh: "", productid: "" };
    setMissForm(existing);
    setMissModalOpen(true);
  };

  const saveMissModal = () => {
  if (!canModifyShipment) return;
  const newShipment = [...shipment];
  newShipment[missEditIndex].misshandling = { ...missForm };
  setShipment(newShipment);

  // Save both shipment and miscellaneous
  saveShipmentToDB(newShipment);

  // Extract misc item for saving
  const miscItem = newShipment[missEditIndex];
  const miscRecord = {
    contractNR: miscItem.contractNR,
    productDescription: miscItem.productDescription,
    doNR: miscItem.doNR,
    misshandling: miscItem.misshandling,
  };
  saveMiscellaneousToDB([miscRecord]);

  setMissModalOpen(false);
};


  // ---------------- User management ----------------
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");

  const addUser = () => {
    if (!canManageUsers) return alert("Not allowed");
    if (!newUsername || !newPassword || !newRole) return alert("Fill username, password, role");
    if (users.find((u) => u.username === newUsername)) return alert("Username exists");
    setUsers([...users, { username: newUsername, password: newPassword, role: newRole }]);
    setNewUsername("");
    setNewPassword("");
    setNewRole("user");
  };

  const updateUserField = (index, field, value) => {
    if (!canManageUsers) return;
    const updated = [...users];
    updated[index] = { ...updated[index], [field]: value };
    setUsers(updated);
  };

  const deleteUser = (usernameToDelete) => {
    if (!canManageUsers) return;
    if (usernameToDelete === "admin") return alert("Cannot delete main admin");
    setUsers(users.filter((u) => u.username !== usernameToDelete));
  };

  // ---------------- Filtering ----------------
  const filteredSchedule = schedule.filter((it) =>
    JSON.stringify(it).toLowerCase().includes(scheduleSearch.toLowerCase())
  );

  const filteredShipment = shipment
    .map((it, index) => ({ ...it, _index: index })) // keep original index
    .filter((it) =>
      JSON.stringify(it).toLowerCase().includes(shipmentSearch.toLowerCase())
    );

  const filteredMisc = shipment
    .map((it, index) => ({ ...it, _index: index }))
    .filter(
      (s) =>
        s.misshandling?.rootCause &&
        JSON.stringify(s).toLowerCase().includes(miscSearch.toLowerCase())
    );

  // ---------------- Render ----------------
  if (!user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Warehouse Application</h1>
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleLogin}>Login</button>
          </div>
          {/* 👇 Show error if login fails */}
        {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>📦 Warehouse</h2>
        <p style={{ fontSize: 13, color: "#333", marginBottom: 8 }}>
          User: {user?.username} ({user?.role})
        </p>
        <nav>
          <button className={activeTab === "schedule" ? "active" : ""} onClick={() => setActiveTab("schedule")}>Schedule</button>
          <button className={activeTab === "shipment" ? "active" : ""} onClick={() => setActiveTab("shipment")}>Shipment Report</button>
          <button className={activeTab === "summary" ? "active" : ""} onClick={() => setActiveTab("summary")}>Summary</button>
          <button className={activeTab === "misc" ? "active" : ""} onClick={() => setActiveTab("misc")}>Miscellaneous</button>
          {canManageUsers && <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>User Management</button>}
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </nav>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Schedule */}
        {activeTab === "schedule" && (
          <section className="card">
            <h2>Schedule ({filteredSchedule.length} / {schedule.length})</h2>
            <div className="actions">
              <button onClick={exportSchedule}>Export Excel</button>
              <input type="file" accept=".xlsx, .xls" onChange={importSchedule} disabled={!canModifySchedule} />
              <input type="text" placeholder="Search Schedule..." value={scheduleSearch} onChange={(e) => setScheduleSearch(e.target.value)} />
            </div>
            <div className="table-container">
              <table className="freeze-header">
                <thead>
                  <tr>{scheduleCols.map((c) => <th key={c}>{c}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredSchedule.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {scheduleCols.map((col) => {
                        const cellVal = row[col] || "";
                        if (canModifySchedule) {
                          return (
                            <td key={col}>
                              <input type="text" value={cellVal} onChange={(e) => handleScheduleCellChange(rIdx, col, e.target.value)} />
                            </td>
                          );
                        } else {
                          return <td key={col}>{cellVal}</td>;
                        }
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Shipment */}
        {activeTab === "shipment" && (
          <section className="card">
            <h2>Shipment Report ({filteredShipment.length} / {shipment.length})</h2>
            <div className="actions">
              <button onClick={exportShipment}>Export Excel</button>
              <input type="text" placeholder="Search Shipment..." value={shipmentSearch} onChange={(e) => setShipmentSearch(e.target.value)} />
            </div>
            <div className="table-container">
              <table className="freeze-header">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Contract NR</th>
                    <th>Product Description</th>
                    <th>DO NR</th>
                    <th>EMKL</th>
                    <th>Buyer</th>
                    <th>Entry Time</th>
                    <th>Start Time</th>
                    <th>Finish Time</th>
                    <th>Police NR</th>
                    <th>Container NR</th>
                    <th>Seal NR</th>
                    <th>Checker</th>
                    <th>Buruh</th>
                    <th>Misshandling</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShipment.map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <select value={it.status} onChange={(e) => handleShipmentChange(it._index, "status", e.target.value)} disabled={!canModifyShipment}>
                          <option value="">Select Status</option>
                          <option value="Reject">Reject</option>
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                      <td>{it.contractNR}</td>
                      <td>{it.productDescription}</td>
                      <td>{it.doNR}</td>
                      <td>{it.emkl}</td>
                      <td>{it.buyer}</td>
                      <td><input type="datetime-local" value={it.entryTime || ""} onChange={(e) => handleShipmentChange(it._index, "entryTime", e.target.value)} disabled={!canModifyShipment} /></td>
                      <td><input type="datetime-local" value={it.startTime || ""} onChange={(e) => handleShipmentChange(it._index, "startTime", e.target.value)} disabled={!canModifyShipment} /></td>
                      <td><input type="datetime-local" value={it.finishTime || ""} onChange={(e) => handleShipmentChange(it._index, "finishTime", e.target.value)} disabled={!canModifyShipment} /></td>
                      <td><input type="text" value={it.policeNR || ""} onChange={(e) => handleShipmentChange(it._index, "policeNR", e.target.value)} disabled={!canModifyShipment} /></td>
                      <td><input type="text" value={it.containerNR || ""} onChange={(e) => handleShipmentChange(it._index, "containerNR", e.target.value)} disabled={!canModifyShipment} /></td>
                      <td><input type="text" value={it.sealNR || ""} onChange={(e) => handleShipmentChange(it._index, "sealNR", e.target.value)} disabled={!canModifyShipment} /></td>
                      <td><input type="text" value={it.checker || ""} onChange={(e) => handleShipmentChange(it._index, "checker", e.target.value)} disabled={!canModifyShipment} /></td>
                      <td><input type="text" value={it.buruh || ""} onChange={(e) => handleShipmentChange(it._index, "buruh", e.target.value)} disabled={!canModifyShipment} /></td>
                      <td>
                        <button onClick={() => openMissModal(it._index)} disabled={!canModifyShipment}>
                          {it.misshandling?.rootCause ? "Edit" : "Add"}
                        </button>
                      </td>
                      <td><input type="text" value={it.remark || ""} onChange={(e) => handleShipmentChange(it._index, "remark", e.target.value)} disabled={!canModifyShipment} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

       {/* ================== SUMMARY ================== */}
{activeTab === "summary" && (
  <section className="card">
    <h2>Summary</h2>

    {/* Filters */}
    <div className="actions">
      <button onClick={exportSummary}>Export Excel</button>

      <input
        type="text"
        placeholder="Search Summary..."
        value={summarySearch}
        onChange={(e) => setSummarySearch(e.target.value)}
      />

      <label>
        From:{" "}
        <input
          type="datetime-local"
          value={summaryFrom}
          onChange={(e) => setSummaryFrom(e.target.value)}
        />
      </label>

      <label>
        To:{" "}
        <input
          type="datetime-local"
          value={summaryTo}
          onChange={(e) => setSummaryTo(e.target.value)}
        />
      </label>
    </div>

    {/* Content */}
    {(() => {
      try {
        // parse date filters safely
        const fromDate = summaryFrom ? new Date(summaryFrom) : null;
        const toDate = summaryTo ? new Date(summaryTo) : null;

        // 1) Build groupMap from schedule using Contract NR + DO NR as key
        const groupMap = {};
        (schedule || []).forEach((sch) => {
          const contractNR = (sch["Contract NR"] || "").toString();
          const doNR = (sch["DO NR"] || "").toString();
          const key = `${contractNR}||${doNR}`;

          // parse QTY (FCL) defensively; fallback to 1
          let qtyFCL = parseInt(sch["QTY (FCL)"], 10);
          if (!Number.isFinite(qtyFCL)) {
            const raw = (sch["QTY (FCL)"] || "").toString().replace(/[^\d-]/g, "");
            qtyFCL = raw ? parseInt(raw, 10) || 1 : 1;
          }

          if (!groupMap[key]) {
            groupMap[key] = {
              contractNR,
              doNR,
              productDescription: (sch["Product Description"] || "").toString(),
              buyer: (sch["Buyer"] || "").toString(),
              qtyFCL: qtyFCL,
              completed: 0,
            };
          } else {
            groupMap[key].qtyFCL += qtyFCL;
          }
        });

        // 2) Walk shipments and increment `completed` for matching groups (respecting date filters)
        (shipment || []).forEach((s) => {
          const entryTimeStr = (s.entryTime || "").toString();
          const entryDate = entryTimeStr.trim() !== "" ? new Date(entryTimeStr) : null;

          if (fromDate && (!entryDate || entryDate < fromDate)) return;
          if (toDate && (!entryDate || entryDate > toDate)) return;

          const key = `${(s.contractNR || "").toString()}||${(s.doNR || "").toString()}`;
          if (groupMap[key]) {
            if ((s.status || "").toString().toLowerCase() === "completed") {
              groupMap[key].completed += 1;
            }
          }
        });

        // 3) Convert map to array and compute incomplete = qtyFCL - completed (min 0)
        let groupedArray = Object.values(groupMap).map((g) => {
          const completed = Number.isFinite(g.completed) ? g.completed : 0;
          const qty = Number.isFinite(g.qtyFCL) ? g.qtyFCL : 0;
          const incomplete = Math.max(0, qty - completed);
          return { ...g, completed, incomplete };
        });

        // 4) Apply search (only show groups matching the search)
        const search = (summarySearch || "").toString().trim().toLowerCase();
        if (search !== "") {
          groupedArray = groupedArray.filter((g) => {
            return (
              (g.contractNR || "").toString().toLowerCase().includes(search) ||
              (g.doNR || "").toString().toLowerCase().includes(search) ||
              (g.productDescription || "").toString().toLowerCase().includes(search) ||
              (g.buyer || "").toString().toLowerCase().includes(search)
            );
          });
        }

        // prepare chart data
        const chartData = groupedArray.map((g) => ({
          name: `${g.contractNR}-${g.doNR}`,
          Completed: g.completed,
          Incomplete: g.incomplete,
        }));

        // ✅ calculate totals
        const totalCompletedQty = groupedArray.reduce((sum, g) => sum + g.completed, 0);
        const totalIncompleteQty = groupedArray.reduce((sum, g) => sum + g.incomplete, 0);

        return (
          <div>
            {/* Chart + Totals */}
            <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
              <BarChart width={700} height={300} data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="Completed" fill="#10B981" />
                <Bar dataKey="Incomplete" fill="#EF4444" />
              </BarChart>

              {/* ✅ Totals */}
              <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                <p style={{ color: "green" }}>✅ Total Completed QTY: {totalCompletedQty}</p>
                <p style={{ color: "red" }}>❌ Total Incomplete QTY: {totalIncompleteQty}</p>
              </div>
            </div>

            {/* Summary table */}
            <h3 style={{ marginTop: 16 }}>
              Grouped Summary ({groupedArray.length} groups)
            </h3>
            <div className="table-container">
              <table className="freeze-header">
                <thead>
                  <tr>
                    <th>Contract NR</th>
                    <th>DO NR</th>
                    <th>Product</th>
                    <th>Buyer</th>
                    <th>QTY (FCL)</th>
                    <th>Completed</th>
                    <th>Incomplete</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedArray.map((g, idx) => (
                    <tr key={idx}>
                      <td>{g.contractNR}</td>
                      <td>{g.doNR}</td>
                      <td>{g.productDescription}</td>
                      <td>{g.buyer}</td>
                      <td>{g.qtyFCL}</td>
                      <td style={{ color: "green" }}>{g.completed}</td>
                      <td style={{ color: "red" }}>{g.incomplete}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      } catch (err) {
        console.error("Summary render error:", err);
        return <p style={{ color: "red" }}>Error rendering summary.</p>;
      }
    })()}
  </section>
)}


        {/* Miscellaneous */}
        {activeTab === "misc" && (
          <section className="card">
            <h2>Miscellaneous - Misshandling Reports ({filteredMisc.length} / {shipment.filter(s => s.misshandling?.rootCause).length})</h2>
            <div className="actions">
            <button onClick={exportMisc}>Export Excel</button>
              <input type="text" placeholder="Search Misshandling..." value={miscSearch} onChange={(e) => setMiscSearch(e.target.value)} />
            </div>
            <div className="table-container">
              <table className="freeze-header">
                <thead>
                  <tr>
                    <th>Contract NR</th>
                    <th>Product Description</th>
                    <th>DO NR</th>
                    <th>Root Cause</th>
                    <th>QTY</th>
                    <th>Buruh</th>
                    <th>Product ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMisc.map((s, idx) => (
                    <tr key={idx}>
                      <td>{s.contractNR}</td>
                      <td>{s.productDescription}</td>
                      <td>{s.doNR}</td>
                      <td>{s.misshandling.rootCause}</td>
                      <td>{s.misshandling.qty}</td>
                      <td>{s.misshandling.buruh}</td>
                      <td>{s.misshandling.productid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* User Management */}
        {activeTab === "users" && canManageUsers && (
          <section className="card">
            <h2>User Management</h2>
            <div className="actions">
              <input type="text" placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
              <input type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                <option value="user">user</option>
                <option value="operator">operator</option>
                <option value="team-leader">team-leader</option>
                <option value="supervisor">supervisor</option>
                <option value="manager">manager</option>
                <option value="admin">admin</option>
              </select>
              <button onClick={addUser}>Add User</button>
            </div>
            <div className="table-container">
              <table className="freeze-header">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i}>
                      <td>{u.username}</td>
                      <td><input type="text" value={u.password} onChange={(e) => updateUserField(i, "password", e.target.value)} /></td>
                      <td>
                        <select value={u.role} onChange={(e) => updateUserField(i, "role", e.target.value)}>
                          <option value="user">user</option>
                          <option value="operator">operator</option>
                          <option value="team-leader">team-leader</option>
                          <option value="supervisor">supervisor</option>
                          <option value="manager">manager</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td><button onClick={() => deleteUser(u.username)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Misshandling Modal */}
      {missModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Edit Misshandling</h3>
            <input type="text" placeholder="Root Cause" value={missForm.rootCause} onChange={(e) => setMissForm({ ...missForm, rootCause: e.target.value })} />
            <input type="text" placeholder="QTY" value={missForm.qty} onChange={(e) => setMissForm({ ...missForm, qty: e.target.value })} />
            <input type="text" placeholder="Buruh" value={missForm.buruh} onChange={(e) => setMissForm({ ...missForm, buruh: e.target.value })} />
            <input type="text" placeholder="Product ID" value={missForm.productid} onChange={(e) => setMissForm({ ...missForm, productid: e.target.value })} />
            <div className="modal-actions">
              <button onClick={saveMissModal}>Save</button>
              <button onClick={() => setMissModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
