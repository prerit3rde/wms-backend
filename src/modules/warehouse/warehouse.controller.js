const pool = require("../../config/db");

const warehouseService = require("./warehouse.service");
const kru2uni = require("@anthro-ai/krutidev-unicode");

const convertHindi = (val) => {
  if (!val) return val;
  const str = val.toString().trim();

  // 1. Single characters (A, B, C) or clearly English codes (A-Z, 0-9)
  if (/^[A-Za-z0-9\s]$/.test(str)) return str;

  // 2. FORCED KRUTIDEV SIGNATURES
  // Symbols like [ ] \ ; { } or starting with ' are almost exclusively KrutiDev in these sheets.
  const hasKrutiDevSigns = /[\]\\[;{}]/.test(str) || str.startsWith("'");
  if (hasKrutiDevSigns) {
    try {
      return kru2uni(str).trim();
    } catch (e) {
      return str;
    }
  }

  // 3. ENGLISH PROTECTION (Heuristic)
  // - All Caps with spaces/numbers (Company names)
  // - Mixed Case with healthy vowel ratio (People's names)
  // - Common English warehouse terms
  const isAllCaps = /^[A-Z0-9\s,./&()*'#_-]*$/.test(str) && str.length > 2;
  const isProperName = /^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/.test(str);

  // Vowel Check: English names/words almost always have higher vowel density.
  // KrutiDev strings often have very few or none in English vowel positions.
  const vowels = (str.match(/[aeiou]/gi) || []).length;
  const ratio = vowels / str.length;
  const hasHealthyVowels = ratio > 0.20 || (vowels >= 2 && str.length < 15);

  const commonEnglish = ["PART", "PMS", "PoS", "WAREHOUSE", "GODOWN", "District", "Branch", "Agro", "Logistics", "Park", "LLP", "EMI", "JVS", "WMS"];
  const matchesCommon = commonEnglish.some(word => str.toUpperCase().includes(word.toUpperCase()));

  // 4. PAN NUMBER DETECTION (5 letters, 4 numbers, 1 letter)
  const isPan = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(str.toUpperCase());

  if (isPan || isAllCaps || isProperName || (hasHealthyVowels && str.length > 3) || matchesCommon) {
    return str; // High confidence it's English
  }

  try {
    return kru2uni(str).trim();
  } catch (e) {
    return str;
  }
};

exports.getWarehouseFilters = async (req, res) => {
  try {
    const data = await warehouseService.getWarehouseFilters();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createWarehouse = async (req, res) => {
  try {
    const result = await warehouseService.createWarehouse(
      req.body,
      req.user.id
    );
    // console.log("Warehouse created with ID:", req.user.id);
    res.status(201).json({
      message: "Warehouse created successfully",
      warehouseId: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getWarehouses = async (req, res) => {
  try {
    const result = await warehouseService.getWarehouses(req.query);

    return res.status(200).json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.deleteWarehouse = async (req, res) => {
  try {
    const result = await warehouseService.deleteWarehouse(req.params.id);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Warehouse not found or already deleted",
      });
    }

    res.json({ message: "Warehouse deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getWarehouseById = async (req, res) => {
  try {
    const warehouse = await warehouseService.getWarehouseById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }

    res.json(warehouse);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateWarehouse = async (req, res) => {
  try {
    const result = await warehouseService.updateWarehouse(
      req.params.id,
      req.body
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }

    res.json({
      message: "Warehouse updated successfully",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.bulkInsertWarehouses = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { data } = req.body;

    if (!data || !data.length) {
      return res.status(400).json({ message: "No data provided" });
    }

    // Mapping definition (Hindi/KrutiDev -> DB Field)
    const mapping = [
      { key: "जिला", field: "district_name" },
      { key: "शाखा", field: "branch_name" },
      { key: "वेअरहाउस", field: "warehouse_name" },
      { key: "योजना", field: "scheme" },
      { key: "योजना दर राशि", field: "scheme_rate_amount" },
      { key: "अनुबंधित भंडारण क्षमता", field: "storage_capacity" },
      { key: "अनुबंध दिनांक", field: "contract_date" },
      { key: "गोदाम क्रमांक", field: "warehouse_no" },
      { key: "Bank Solvancy का प्रमाण पत्र की राशि", field: "bank_solvency_type_header" },
      { key: "Bank Solvancy के शपथ पत्र की राशि", field: "bank_solvency_affidavit_val" },
      { key: "Bank Solvancy Diduction By Bill", field: "bank_solvency_deduction_by_bill" },
      { key: "Balance Amount Bank Solvancy", field: "bank_solvency_balance_amount" },
      { key: "TOTAL EMI", field: "total_emi" },
      { key: "EMI Diduction By Bill", field: "emi_deduction_by_bill" },
      { key: "Balance Amount EMI", field: "balance_amount_emi" },
      { key: "Pan Card Holder", field: "pan_card_holder" },
      { key: "Pan Card No", field: "pan_card_number" },
    ];

    const normalizeString = (s) => s?.toString().toLowerCase().replace(/\s+/g, "").trim() || "";

    let inserted = 0;
    let updated = 0;

    for (let row of data) {
      const mappedRow = {};

      // Normalize row keys and values
      Object.keys(row).forEach((key) => {
        const unicodeKey = convertHindi(key);
        // FORCED conversion for key to be absolutely sure we catch KrutiDev headers
        const forcedUnicodeKey = kru2uni(key.toString()).trim();

        const normKey = normalizeString(unicodeKey);
        const normForced = normalizeString(forcedUnicodeKey);
        const normRaw = normalizeString(key);

        const match = mapping.find(m => {
          const mNorm = normalizeString(m.key);
          const mUniNorm = normalizeString(convertHindi(m.key));
          return mNorm === normKey || mNorm === normForced || mNorm === normRaw ||
            mUniNorm === normKey || mUniNorm === normForced || mUniNorm === normRaw;
        });

        if (match) {
          mappedRow[match.field] = row[key]; // Capture RAW value for logic later
        }
      });

      if (!mappedRow.warehouse_name) {
        console.log(`!!! SKIP ROW: warehouse_name not found. Available fields: ${Object.keys(mappedRow).join(', ')}`);
        continue;
      }

      // --- DERIVE FIELDS ---
      // We only convert Hindi for specific fields known to be Hindi
      const district_name = convertHindi(mappedRow.district_name);
      const branch_name = convertHindi(mappedRow.branch_name);
      const warehouse_name = convertHindi(mappedRow.warehouse_name);
      const pan_card_holder = convertHindi(mappedRow.pan_card_holder);
      const warehouse_owner_name = warehouse_name;
      const warehouse_type_id = 1;

      // Crop Year Logic
      let crop_year = "";
      const rawDate = mappedRow.contract_date;
      if (rawDate) {
        let dateObj;
        const serial = parseFloat(rawDate);
        if (!isNaN(serial) && serial > 40000) {
          // Excel numeric date (Approx > 2009)
          dateObj = new Date(Math.round((serial - 25569) * 86400 * 1000));
        } else {
          // Attempt string parse "DD/MM/YY" or "DD/MM/YYYY"
          const parts = rawDate.toString().split("/");
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            let year = parseInt(parts[2]);
            if (year < 100) year += 2000;
            dateObj = new Date(year, month, day);
          }
        }

        if (dateObj && !isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = dateObj.getMonth() + 1; // 1-12
          // As per user: 11/03/24 is 2024-25. 
          // This implies January, February, March of Year belong to Year-(Year+1)?
          // Or strictly the financial year mapping.
          if (month <= 3) {
            // Jan, Feb, Mar 2024 -> 2024-25 (As requested)
            crop_year = `${year}-${(year + 1).toString().slice(-2)}`;
          } else {
            // April 2024 -> 2024-25 
            crop_year = `${year}-${(year + 1).toString().slice(-2)}`;
          }
        }
      }

      console.log(`Processing Warehouse: ${warehouse_name}, Crop Year: ${crop_year}`);

      // Bank Solvency Logic
      let bank_solvency_certificate_amount = 0;
      let bank_solvency_affidavit_amount = 0;
      let is_affidavit = 0;

      // 🔥 CRITICAL FIX: Convert headers to Unicode BEFORE checking for "शपथ पत्र"
      const rawBsHeader = mappedRow.bank_solvency_type_header?.toString() || "";
      const unicodeBsHeader = convertHindi(rawBsHeader);

      console.log(`Checking BS Header: "${rawBsHeader}" -> Unicode: "${unicodeBsHeader}"`);

      if (unicodeBsHeader.includes("शपथ पत्र")) {
        is_affidavit = 1;
        bank_solvency_affidavit_amount = parseFloat(mappedRow.bank_solvency_affidavit_val || 0) || 0;
      } else if (unicodeBsHeader.includes("प्रमाण पत्र")) {
        is_affidavit = 0;
        // Extracts amount from header like "प्रमाण पत्र 450000"
        const match = unicodeBsHeader.match(/(\d+)/);
        if (match) {
          bank_solvency_certificate_amount = parseFloat(match[1]) || 0;
        } else {
          // Fallback if amount is in the other column but it's "प्रमाण पत्र"
          bank_solvency_certificate_amount = parseFloat(mappedRow.bank_solvency_affidavit_val || 0) || 0;
        }
      }

      console.log(`   BS Result: is_affidavit=${is_affidavit}, AffAmt=${bank_solvency_affidavit_amount}, CertAmt=${bank_solvency_certificate_amount}`);

      const storage = parseFloat(mappedRow.storage_capacity || 0) || 0;

      // 1. Process WAREHOUSES table
      const [existingWarehouses] = await conn.query(
        `SELECT id FROM warehouses 
         WHERE LOWER(TRIM(warehouse_name)) = LOWER(TRIM(?))
         AND LOWER(TRIM(district_name)) = LOWER(TRIM(?))
         AND LOWER(TRIM(branch_name)) = LOWER(TRIM(?))
         AND is_deleted = FALSE`,
        [warehouse_name, district_name, branch_name]
      );

      let warehouseId;
      if (existingWarehouses.length > 0) {
        warehouseId = existingWarehouses[0].id;
        await conn.query(
          `UPDATE warehouses SET 
            warehouse_owner_name = ?,
            warehouse_type_id = ?,
            warehouse_no = ?,
            pan_card_holder = ?,
            pan_card_number = ?,
            is_imported = 1
           WHERE id = ?`,
          [
            warehouse_owner_name,
            warehouse_type_id,
            mappedRow.warehouse_no,
            pan_card_holder,
            mappedRow.pan_card_number,
            warehouseId,
          ]
        );
        updated++;
      } else {
        const [insertResult] = await conn.query(
          `INSERT INTO warehouses (
            district_name, branch_name, warehouse_name, warehouse_owner_name, 
            warehouse_type_id, warehouse_no, pan_card_holder, pan_card_number, is_imported
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            district_name,
            branch_name,
            warehouse_name,
            warehouse_owner_name,
            warehouse_type_id,
            mappedRow.warehouse_no,
            pan_card_holder,
            mappedRow.pan_card_number,
          ]
        );
        warehouseId = insertResult.insertId;
        inserted++;
      }

      // 2. Process WAREHOUSE_CROP_DATA table
      if (crop_year) {
        // Check if crop data exists for this year
        const [existingCropData] = await conn.query(
          `SELECT id FROM warehouse_crop_data 
           WHERE warehouse_id = ? AND crop_year = ?`,
          [warehouseId, crop_year]
        );

        const cropPayload = [
          warehouseId,
          crop_year,
          mappedRow.scheme,
          parseFloat(mappedRow.scheme_rate_amount || 0) || 0,
          storage, // actual_storage_capacity
          storage, // approved_storage_capacity
          is_affidavit,
          bank_solvency_affidavit_amount,
          bank_solvency_certificate_amount,
          parseFloat(mappedRow.bank_solvency_deduction_by_bill || 0) || 0,
          parseFloat(mappedRow.bank_solvency_balance_amount || 0) || 0,
          parseFloat(mappedRow.total_emi || 0) || 0,
          parseFloat(mappedRow.emi_deduction_by_bill || 0) || 0,
          parseFloat(mappedRow.balance_amount_emi || 0) || 0,
        ];

        if (existingCropData.length > 0) {
          await conn.query(
            `UPDATE warehouse_crop_data SET 
              scheme = ?,
              scheme_rate_amount = ?,
              actual_storage_capacity = ?,
              approved_storage_capacity = ?,
              is_affidavit = ?,
              bank_solvency_affidavit_amount = ?,
              bank_solvency_certificate_amount = ?,
              bank_solvency_deduction_by_bill = ?,
              bank_solvency_balance_amount = ?,
              total_emi = ?,
              emi_deduction_by_bill = ?,
              balance_amount_emi = ?
             WHERE id = ?`,
            [...cropPayload.slice(2), existingCropData[0].id]
          );
        } else {
          await conn.query(
            `INSERT INTO warehouse_crop_data (
              warehouse_id, crop_year, scheme, scheme_rate_amount, 
              actual_storage_capacity, approved_storage_capacity, is_affidavit,
              bank_solvency_affidavit_amount, bank_solvency_certificate_amount,
              bank_solvency_deduction_by_bill, bank_solvency_balance_amount,
              total_emi, emi_deduction_by_bill, balance_amount_emi
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            cropPayload
          );
        }
      }
    }

    await conn.commit();
    res.json({
      success: true,
      message: `Warehouses processed: ${inserted + updated} (Inserted: ${inserted}, Updated: ${updated})`,
    });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("IMPORT ERROR 👉", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    if (conn) conn.release();
  }
};
