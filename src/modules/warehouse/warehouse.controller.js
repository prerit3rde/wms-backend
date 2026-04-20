const pool = require("../../config/db");

const warehouseService = require("./warehouse.service");
const kru2uni = require("@anthro-ai/krutidev-unicode");

const ENGLISH_WHITELIST = [
  "INDORE", "DHAR", "KHANDWA", "KHARGONE", "JHABUA", "BURHANPUR", "BADWANI", "BARWANI", "DEWAS", "RATLAM", "UJJAIN", "BHOPAL", "GWALIOR", "JABALPUR",
  "WAREHOUSE", "LOGISTICS", "PARK", "AGRO", "PVT", "LTD", "PART", "GODOWN", "DISTRICT", "BRANCH", "EMI", "PAN", "HOLDER", "BILL", "NO", "NAME", "PMS", "WMS", "JVS", "SCHEME",
  "SHREE", "SHRI", "SAMITI", "MARYADIT", "ADARSH", "SHAKARI", "VIPNAN", "DEPALPUR", "WARE", "HOUSE", "SUPPLY"
];

const convertHindi = (val) => {
  if (!val && val !== 0) return val;
  const str = val.toString().trim();

  const krutiDevMapping = {
    "ftyk": "जिला",
    "'kk[kk": "शाखा",
    "osvjgkml": "वेअरहाउस",
    ";kstuk": "योजना",
    ";kstuk nj jkf'k": "योजना दर राशि",
    "vuqcaf/kr HkaMkj.k {kerk": "अनुबंधित भंडारण क्षमता",
    "okLrfod HkaMkj.k {kerk": "वास्तविक भंडारण क्षमता",
    "okLrfod HkaMkj.k": "वास्तविक भंडारण",
    "vuqca/k fnukad": "अनुबंध दिनांक",
    "xksnke dzekad": "गोदाम क्रमांक",
    "Bank Solvancy dk izek.k i= dh jkf'k": "Bank Solvancy का प्रमाण पत्र की राशि",
    "Bank Solvancy ds 'kiFk i= dh jkf'k": "Bank Solvancy के शपथ पत्र की राशि",
    "Bank Solvancy Diduction By Bill": "Bank Solvancy Diduction By Bill",
    "Balance Amount Bank Solvancy": "Balance Amount Bank Solvancy",
    "TOTAL EMI": "TOTAL EMI",
    "EMI Diduction By Bill": "EMI Diduction By Bill",
    "Balance Amount EMI": "Balance Amount EMI",
    "Pan Card Holder": "Pan Card Holder",
    "Pan Card No": "Pan Card No",
    "'kiFk i=": "शपथ पत्र",
    "izek.k i=": "प्रमाण पत्र",
    "'kifk i=": "शपथ पत्र",
    "izek.k i= ": "प्रमाण पत्र",
    "vuqizkIr": "अनुप्राप्त",
    "izkIr": "प्राप्त",
    "izek.k i= 280000": "प्रमाण पत्र 280000",
    "izek.k i= 450000": "प्रमाण पत्र 450000",
  };

  const directMatch = krutiDevMapping[str];
  if (directMatch) return directMatch;

  // 0. Unicode Detection (Skip if already Devnagri)
  if (/[\u0900-\u097F]/.test(str)) return str;

  const hasKrutiMarkers = (s) => /[¼½¾[\]\\;{}/.]/.test(s);

  const isTokenEnglish = (token) => {
    const upper = token.toUpperCase();
    if (ENGLISH_WHITELIST.some(word => upper.includes(word))) return true;
    if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(upper)) return true;

    // Pure numeric / codes protection
    if (/^[0-9./_-]+$/.test(token)) return true;

    const letters = token.replace(/[^a-zA-Z]/g, '');
    if (letters.length <= 1) return true; // Keep single letters (A, B) as English

    const vowels = (letters.match(/[aeiou]/gi) || []).length;
    const ratio = vowels / letters.length;

    // Increased thresholds to avoid misidentifying long KrutiDev tokens as English
    if (ratio >= 0.35 && letters.length > 5 && !hasKrutiMarkers(token)) return true;
    if (ratio >= 0.40 && !hasKrutiMarkers(token)) return true;

    // Consecutive consonants check
    if (/[b-df-hj-np-tv-z]{4,}/i.test(letters)) return false;

    return ratio >= 0.25;
  };

  // Basic Format Protection (Numbers/Single chars)
  if (str.length <= 1) return str;
  if (!isNaN(str) && !isNaN(parseFloat(str))) return str;

  const upperStr = str.toUpperCase();
  // Initial check for whitelisted whole strings
  if (ENGLISH_WHITELIST.some(word => upperStr.includes(word)) && !hasKrutiMarkers(str)) return str;

  const parts = str.split(/(\s+)/);
  return parts.map(part => {
    if (!part.trim()) return part;
    if (isTokenEnglish(part) && !hasKrutiMarkers(part)) return part;
    try {
      return kru2uni(part);
    } catch (e) {
      return part;
    }
  }).join("");
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

    const { data, default_crop_year } = req.body;

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
        const normKey = unicodeKey.replace(/\s+/g, "").toLowerCase();
        const normRaw = key.toString().replace(/\s+/g, "").toLowerCase();

        const match = mapping.find(m => {
          const mNorm = m.key.replace(/\s+/g, "").toLowerCase();
          return mNorm === normKey || mNorm === normRaw;
        });

        if (match) {
          mappedRow[match.field] = row[key];
        } else {
          // One more try: check if key ALREADY matches a field name (from pre-mapped frontend data)
          const isDbField = mapping.some(m => m.field === key) ||
            ["is_affidavit", "bank_solvency_certificate_amount", "bank_solvency_affidavit_amount", "bs_type"].includes(key);
          if (isDbField) {
            mappedRow[key] = row[key];
          } else if (normKey.includes("गोदाम") && (normKey.includes("क्रमांक") || normKey.includes("क्र"))) {
            mappedRow.warehouse_no = row[key];
          }
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
          crop_year = `${year}-${(year + 1).toString().slice(-2)}`;
        }
      }

      // --- FALLBACK CROP YEAR if contract_date was missing/invalid ---
      if (!crop_year && default_crop_year) {
        // Validate that default_crop_year looks like "2024-25"
        if (/^\d{4}-\d{2}$/.test(default_crop_year)) {
          crop_year = default_crop_year;
        } else {
          // If it's just a year like "2024", format it
          const year = parseInt(default_crop_year);
          if (!isNaN(year)) {
            crop_year = `${year}-${(year + 1).toString().slice(-2)}`;
          }
        }
      }

      console.log(`Processing Warehouse: ${warehouse_name}, Crop Year: ${crop_year}`);

      // Bank Solvency Logic (Refined)
      // Only derive if NOT already provided in the mappedRow (e.g. from frontend)
      let bank_solvency_certificate_amount = parseFloat(mappedRow.bank_solvency_certificate_amount) || 0;
      let bank_solvency_affidavit_amount = parseFloat(mappedRow.bank_solvency_affidavit_amount) || 0;
      let is_affidavit = mappedRow.is_affidavit !== undefined ? (mappedRow.is_affidavit ? 1 : 0) : 0;

      const hasBsPrepopulated = mappedRow.bank_solvency_certificate_amount !== undefined || mappedRow.bank_solvency_affidavit_amount !== undefined;

      if (!hasBsPrepopulated) {
        const rawBsTypeString = mappedRow.bank_solvency_type_header?.toString() || "";
        const unicodeBsType = convertHindi(rawBsTypeString);
        const rawBsAmountFromColB = parseFloat(mappedRow.bank_solvency_affidavit_val?.toString().replace(/,/g, "")) || 0;

        if (unicodeBsType.includes("शपथ पत्र")) {
          is_affidavit = 1;
          bank_solvency_affidavit_amount = rawBsAmountFromColB;
          bank_solvency_certificate_amount = 0;
        } else if (unicodeBsType.includes("प्रमाण पत्र")) {
          is_affidavit = 0;
          const numericInCell = unicodeBsType.match(/(\d+)/);
          if (numericInCell) {
            bank_solvency_certificate_amount = parseFloat(numericInCell[1]);
          } else {
            bank_solvency_certificate_amount = rawBsAmountFromColB;
          }
          bank_solvency_affidavit_amount = 0;
        } else {
          const fallbackAmt = rawBsAmountFromColB || parseFloat(unicodeBsType.replace(/[^\d.]/g, "")) || 0;
          is_affidavit = 0;
          bank_solvency_certificate_amount = fallbackAmt;
          bank_solvency_affidavit_amount = 0;
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
