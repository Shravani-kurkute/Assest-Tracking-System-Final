// System admin page for creating departments and wiring managers to them.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Plus, PlusCircle, UserCog, X } from "lucide-react";
import toast from "react-hot-toast";

import api from "../../api/axios";
import { ROLES } from "../../utils/roles";

const initialForm = {
  name: "",
  code: "",
  description: "",
  managerMode: "new",
  managerId: "",
  managerName: "",
  managerEmail: "",
  managerPassword: "",
};

function CreateDepartmentModal({
  isOpen,
  form,
  managers,
  submitting,
  onChange,
  onClose,
  onSubmit,
  onReset,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-lg">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Administration
            </p>
            <h2 className="mt-2 text-xl font-semibold text-gray-900">
              Create Department
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Add a department and assign a manager now or later.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onReset();
              onClose();
            }}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 px-6 py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Department Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(event) => onChange("name", event.target.value)}
                className="input-field"
                placeholder="Finance"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Department Code
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(event) =>
                  onChange("code", event.target.value.replace(/\s+/g, "").toUpperCase())
                }
                className="input-field"
                placeholder="FI"
                maxLength={8}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-600">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(event) => onChange("description", event.target.value)}
              className="input-field min-h-28 resize-none"
              placeholder="Handles financial operations"
            />
          </div>

          <div className="rounded-xl bg-gray-50 p-5">
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Manager Setup</h3>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Choose how this department should be managed.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onChange("managerMode", "new")}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  form.managerMode === "new"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 shadow-sm hover:bg-gray-100"
                }`}
              >
                Create New Manager
              </button>
              <button
                type="button"
                onClick={() => onChange("managerMode", "existing")}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  form.managerMode === "existing"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 shadow-sm hover:bg-gray-100"
                }`}
              >
                Select Existing Manager
              </button>
              <button
                type="button"
                onClick={() => onChange("managerMode", "none")}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  form.managerMode === "none"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 shadow-sm hover:bg-gray-100"
                }`}
              >
                Create Later
              </button>
            </div>

            {form.managerMode === "new" ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  value={form.managerName}
                  onChange={(event) => onChange("managerName", event.target.value)}
                  className="input-field md:col-span-2"
                  placeholder="Manager name"
                />
                <input
                  type="email"
                  value={form.managerEmail}
                  onChange={(event) => onChange("managerEmail", event.target.value)}
                  className="input-field"
                  placeholder="manager@company.com"
                />
                <input
                  type="password"
                  value={form.managerPassword}
                  onChange={(event) => onChange("managerPassword", event.target.value)}
                  className="input-field"
                  placeholder="Password"
                />
              </div>
            ) : null}

            {form.managerMode === "existing" ? (
              <div className="mt-5">
                <select
                  value={form.managerId}
                  onChange={(event) => onChange("managerId", event.target.value)}
                  className="input-field"
                >
                  <option value="">Choose an unassigned manager</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.full_name} ({manager.email})
                    </option>
                  ))}
                </select>
                {!managers.length ? (
                    <p className="mt-2 text-xs text-gray-500">
                      No unassigned managers are available right now.
                    </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => {
                onReset();
                onClose();
              }}
              className="btn-secondary rounded-xl px-4 py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-3"
            >
              <PlusCircle className="h-4 w-4" />
              {submitting ? "Creating..." : "Create Department"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  const toneStyles = {
    sky: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
          toneStyles[tone] || toneStyles.sky
        }`}
      >
        {label}
      </div>
      <p className="mt-4 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [departmentsResponse, usersResponse] = await Promise.all([
        api.get("/departments"),
        api.get("/users"),
      ]);

      const departmentRows = Array.isArray(departmentsResponse.data)
        ? departmentsResponse.data
        : [];
      const userRows = Array.isArray(usersResponse.data) ? usersResponse.data : [];

      setDepartments(departmentRows);
      setManagers(
        userRows.filter(
          (user) => user.role === ROLES.DEPT_ADMIN && !user.department_id
        )
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "We could not load departments right now."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const totalEmployees = useMemo(
    () =>
      departments.reduce(
        (runningTotal, department) => runningTotal + (department.employees_count || 0),
        0
      ),
    [departments]
  );

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
  };

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Department name and code are required.");
      return;
    }

    if (form.managerMode === "new") {
      if (
        !form.managerName.trim() ||
        !form.managerEmail.trim() ||
        !form.managerPassword.trim()
      ) {
        toast.error("Please complete the manager details.");
        return;
      }
    }

    if (form.managerMode === "existing" && !form.managerId) {
      toast.error("Please choose an existing manager.");
      return;
    }

    setSubmitting(true);

    try {
      const departmentResponse = await api.post("/departments", {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
      });

      const departmentId = departmentResponse.data?.id;

      if (departmentId && form.managerMode === "new") {
        await api.post("/users/create-manager", {
          name: form.managerName.trim(),
          email: form.managerEmail.trim().toLowerCase(),
          password: form.managerPassword,
          department_id: departmentId,
        });
      }

      if (departmentId && form.managerMode === "existing") {
        await api.put("/users/assign-manager", {
          manager_id: Number(form.managerId),
          department_id: departmentId,
        });
      }

      toast.success("Department created successfully.");
      closeModal();
      resetForm();
      await loadDepartments();
      window.dispatchEvent(new Event("dataUpdated"));
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.detail || "Unable to create the department."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-panel">
        <div className="loading-spinner" />
        <h2 className="mt-5 text-xl font-semibold text-slate-900">
          Loading departments
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Fetching department summaries and manager availability.
        </p>
      </div>
    );
  }

  return (
    <>
      <CreateDepartmentModal
        isOpen={isModalOpen}
        form={form}
        managers={managers}
        submitting={submitting}
        onChange={updateForm}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onReset={resetForm}
      />

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="space-y-8">
          {error ? <div className="feedback-error">{error}</div> : null}

          <section className="flex justify-end">
            <button
              type="button"
              onClick={openModal}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Department
            </button>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard label="Departments" value={departments.length} tone="sky" />
            <SummaryCard
              label="Managers"
              value={departments.filter((department) => department.manager).length}
              tone="emerald"
            />
            <SummaryCard label="Employees" value={totalEmployees} tone="violet" />
          </section>

          <section className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5">
              <h2 className="text-xl font-semibold text-gray-900">
                Department Directory
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Review department ownership, codes, and employee counts.
              </p>
            </div>

            {!departments.length ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Building2 className="h-7 w-7 text-gray-500" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">
                  No departments created
                </h3>
                <p className="mt-2 max-w-md text-sm text-gray-500">
                  Create your first department to start assigning managers and
                  employees.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="table-header">Department</th>
                      <th className="table-header">Code</th>
                      <th className="table-header">Description</th>
                      <th className="table-header">Manager</th>
                      <th className="table-header">Total Employees</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {departments.map((department) => (
                      <tr key={department.id} className="table-row">
                        <td className="table-cell">
                          <p className="font-medium text-gray-900">{department.name}</p>
                        </td>
                        <td className="table-cell">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                            {department.code}
                          </span>
                        </td>
                        <td className="table-cell max-w-sm">
                          <p className="line-clamp-2 text-gray-600">
                            {department.description || "No description"}
                          </p>
                        </td>
                        <td className="table-cell">
                          {department.manager ? (
                            <div>
                              <p className="font-medium text-gray-900">
                                {department.manager.full_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {department.manager.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not assigned</span>
                          )}
                        </td>
                        <td className="table-cell font-medium text-gray-900">
                          {department.employees_count || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      </div>
    </>
  );
}
