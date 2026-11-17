// Department admin panel for creating and reviewing department employees.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, PlusCircle, Users2, X } from "lucide-react";
import toast from "react-hot-toast";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../utils/roles";

const initialForm = {
  name: "",
  email: "",
  password: "",
};

function CreateEmployeeModal({
  isOpen,
  form,
  departmentName,
  submitting,
  onChange,
  onClose,
  onReset,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
              Department
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Create Employee
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add a new employee to {departmentName || "your department"}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onReset();
              onClose();
            }}
            className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 px-6 py-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Department
            </label>
            <input
              type="text"
              value={departmentName || ""}
              className="input-field bg-slate-50"
              readOnly
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Employee Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => onChange("name", event.target.value)}
              className="input-field"
              placeholder="Employee Name"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              className="input-field"
              placeholder="employee@company.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => onChange("password", event.target.value)}
              className="input-field"
              placeholder="Password"
              required
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
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
              {submitting ? "Creating..." : "Create Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  const toneStyles = {
    sky: "bg-sky-50 text-sky-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
      <div
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
          toneStyles[tone] || toneStyles.sky
        }`}
      >
        {label}
      </div>
      <p className="mt-4 text-2xl font-semibold leading-tight text-slate-900 break-words">
        {value}
      </p>
    </div>
  );
}

export default function DepartmentUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadDepartmentUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/users");
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "We could not load department users."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartmentUsers();
  }, [loadDepartmentUsers]);

  useEffect(() => {
    const handleRefresh = () => {
      loadDepartmentUsers();
    };

    window.addEventListener("dataUpdated", handleRefresh);
    return () => window.removeEventListener("dataUpdated", handleRefresh);
  }, [loadDepartmentUsers]);

  const employees = useMemo(
    () => users.filter((entry) => entry.role === ROLES.EMPLOYEE),
    [users]
  );

  const manager = useMemo(
    () => users.find((entry) => entry.role === ROLES.DEPT_ADMIN),
    [users]
  );

  const departmentName = user?.department || manager?.department || "Unassigned";

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => setForm(initialForm);

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("Please complete all employee fields.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/users/create-employee", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      toast.success("Employee created successfully.");
      closeModal();
      resetForm();
      await loadDepartmentUsers();
      window.dispatchEvent(new Event("dataUpdated"));
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.detail || "Unable to create employee."
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
          Loading department users
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Fetching employees assigned to your department.
        </p>
      </div>
    );
  }

  return (
    <>
      <CreateEmployeeModal
        isOpen={isModalOpen}
        form={form}
        departmentName={departmentName}
        submitting={submitting}
        onChange={handleChange}
        onClose={closeModal}
        onReset={resetForm}
        onSubmit={handleSubmit}
      />

      <div className="mx-auto max-w-7xl px-6">
        <div className="space-y-8">
          {error ? <div className="feedback-error">{error}</div> : null}

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
                  Department
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                  Department Users
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  Create employees inside your department and review the current
                  roster without crowding the workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={openModal}
                className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3"
              >
                <Plus className="h-4 w-4" />
                Create Employee
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryCard label="Department" value={departmentName} tone="sky" />
            <SummaryCard
              label="Manager"
              value={manager?.full_name || user?.full_name || "Unassigned"}
              tone="emerald"
            />
            <SummaryCard label="Employees" value={employees.length} tone="violet" />
          </section>

          <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-medium text-slate-900">
                Department Employees
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review employees created inside your department.
              </p>
            </div>

            {!employees.length ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Users2 className="h-7 w-7 text-slate-500" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  No employees yet
                </h3>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Create your first employee to start building the department roster.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="table-header">Name</th>
                      <th className="table-header">Email</th>
                      <th className="table-header">Employee Code</th>
                      <th className="table-header">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="table-row">
                        <td className="table-cell font-medium text-slate-900">
                          {employee.full_name}
                        </td>
                        <td className="table-cell">{employee.email}</td>
                        <td className="table-cell font-medium text-sky-700">
                          {employee.employee_code || employee.employee_id || "Pending"}
                        </td>
                        <td className="table-cell">
                          <span className="status-badge status-available">
                            {employee.is_active ? "Active" : "Inactive"}
                          </span>
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
