const Joi = require("joi");

exports.createPaymentSchema = Joi.object({

    /* ================= Warehouse ================= */

    district_name: Joi.string().required(),
    branch_name: Joi.string().required(),
    warehouse_name: Joi.string().required(),

    warehouse_owner_name: Joi.string().allow("").optional(),
    warehouse_type: Joi.string().allow("").optional(),
    warehouse_no: Joi.string().allow("").optional(),
    gst_no: Joi.string().allow('', null).optional(),

    /* ================= Warehouse EXTRA ================= */

    scheme: Joi.string().allow('', null).optional(),
    scheme_rate_amount: Joi.number().optional(),

    actual_storage_capacity: Joi.number().optional(),
    approved_storage_capacity: Joi.number().optional(),

    bank_solvency_affidavit_amount: Joi.number().optional(),
    bank_solvency_certificate_amount: Joi.number().optional(),
    bank_solvency_deduction_by_bill: Joi.number().optional(),
    bank_solvency_balance: Joi.number().optional(),

    total_emi: Joi.number().optional(),
    emi_deduction_by_bill: Joi.number().optional(),
    emi_balance: Joi.number().optional(),

    pan_card_holder: Joi.string().allow("").optional(),
    pan_card_number: Joi.string().allow("").optional(),

    /* ================= Billing ================= */

    rent_bill_number: Joi.string().allow("").optional(), // ✅ optional
    bill_type: Joi.string().allow("").optional(),

    month: Joi.string().required(),
    financial_year: Joi.string().required(),

    from_date: Joi.string().required(),
    to_date: Joi.string().required(),

    commodity: Joi.string().allow("").optional(),
    rate: Joi.number().optional(),

    rent_bill_amount: Joi.number().optional(),

    bill_amount: Joi.number().required(), // 🔥 MAIN FIELD
    actual_passed_amount: Joi.number().optional(),

    depositers_name: Joi.string().required(), // ✅ NEW REQUIRED FIELD

    /* ================= Scientific Capacity ================= */

    scientific_capacity: Joi.number().optional(),
    number_of_days: Joi.number().optional(),
    per_day_rate: Joi.number().optional(),
    rent_amount_on_scientific_capacity: Joi.number().optional(),

    /* ================= Deductions ================= */

    tds: Joi.number().optional(),
    amount_deducted_against_gain_loss: Joi.number().optional(),
    emi_amount: Joi.number().optional(),

    deduction_20_percent: Joi.number().optional(),

    penalty: Joi.number().optional(),
    medicine: Joi.number().optional(),

    emi_fdr_interest: Joi.number().optional(),

    gain_shortage_deduction: Joi.number().optional(),
    stock_shortage_deduction: Joi.number().optional(),

    bank_solvancy: Joi.number().optional(),
    insurance: Joi.number().optional(),

    other_deduction_amount: Joi.number().optional(),
    other_deductions_reason: Joi.string().allow("").optional(),

    security_fund_amount: Joi.number().optional(),

    /* ================= Payment ================= */

    pay_to_jvs_amount: Joi.number().optional(),
    payment_by: Joi.string().allow("").optional(),
    payment_date: Joi.string().allow("").optional(),
    qtr: Joi.string().allow("").optional(),

    net_amount_payable: Joi.number().optional(),

    remarks: Joi.string().allow("").optional()

}).unknown(false);