# MediCore HMS - Patient Module Schema Proposal

## 1. Purpose

The Patient module stores the patient's core identity,
contact, demographic and registration information.

The module should remain focused on patient identity and
profile information. Domain-specific information such as
appointments, prescriptions, laboratory reports and billing
should remain in their respective modules.

---

## 2. Patient Registration

According to the Patient flow:

Patient
    ↓
Authentication
    ↓
Register
    ↓
Fill Registration Form
    ↓
Personal Details / Contact Information
    ↓
Email & Mobile Verification
    ↓
Create Password
    ↓
Registration Successful
    ↓
Patient Dashboard

A patient is assigned to a branch during registration.

---

## 3. Proposed Patient Fields

### Identity

- patient_id
- first_name
- middle_name
- last_name
- date_of_birth
- gender

### Contact

- email
- mobile_number

### Address

- address_line
- city
- state
- postal_code
- country

### Identification

- id_proof_type
- id_proof_number
- id_proof_document

### Verification

- email_verified
- mobile_verified

### Branch

- branch

The `branch` relationship will be implemented as a ForeignKey
to the Branch model once the Branch model/schema is finalized.

### Account

Authentication credentials should be handled through the
Accounts/Auth module rather than duplicating password handling
inside the Patient model.

---

## 4. Relationships

Patient → Branch
- Many patients can belong to one branch.
- Each patient is assigned to one branch during registration.

Patient → Account
- Authentication/account ownership should be handled through
  the Accounts module.
- Exact relationship will be finalized after the Accounts
  schema is available.

Patient → Appointments
- One patient can have multiple appointments.

Patient → Medical Records
- One patient can have multiple medical records.

Patient → Lab Reports
- One patient can have multiple laboratory reports.

Patient → Prescriptions
- One patient can have multiple prescriptions.

Patient → Billing Records
- One patient can have multiple billing/payment records.

---

## 5. Design Principles

1. Keep the Patient model focused on patient identity/profile.
2. Do not duplicate authentication logic.
3. Do not duplicate appointment, billing, pharmacy or laboratory data.
4. Use ForeignKey relationships for relational data.
5. Avoid storing relationships as plain integer IDs.
6. Use clear field names and database constraints.
7. Keep the schema extensible for future modules.
8. Final relationships should be aligned with the project's
   master database schema before production migration.