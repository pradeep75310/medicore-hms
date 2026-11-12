import React from "react";
import ResourcePage from "../../components/common/ResourcePage";
import { nurseApi } from "../../api/service";
export default function Nurses() {
  return (
    <ResourcePage
      title="Nurses"
      subtitle="Manage nursing staff"
      api={nurseApi}
      columns={[
        { key: "name", label: "Nurse" },
        { key: "qualification", label: "Qualification" },
        { key: "specialization", label: "Specialization" },
        { key: "shift", label: "Shift" },
        { key: "experience_years", label: "Experience" },
        {
          key: "is_available",
          label: "Available",
          render: (r) => (r.is_available ? "Yes" : "No"),
        },
      ]}
      fields={[
        { name: "qualification", label: "Qualification" },
        { name: "registration_number", label: "Registration Number" },
        { name: "specialization", label: "Specialization" },
        {
          name: "experience_years",
          label: "Experience Years",
          type: "number",
          default: 0,
        },
        { name: "shift", label: "Shift" },
        {
          name: "is_available",
          label: "Available",
          type: "select",
          default: "true",
          options: [
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ],
        },
      ]}
    />
  );
}
