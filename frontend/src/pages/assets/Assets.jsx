// Full asset inventory page with search, filters, and admin CRUD actions.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Pencil,
  Plus,
  QrCode,
  ScanLine,
  Search,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../api/axios";
import AssetQRModal from "../../components/assets/AssetQRModal";
import { useAuth } from "../../context/AuthContext";
import { ASSET_CATEGORIES } from "../../utils/assets";
import { ROLES } from "../../utils/roles";

const ADMIN_ROLES = [ROLES.SYSTEM_ADMIN, ROLES.DEPT_ADMIN];
const STATUS_OPTIONS = ["Available", "Assigned", "Maintenance"];

const initialFormState = {
  name: "",
  category: "Laptop",
  description: "",
  status: "Available",
  purchase_date: "",
};

function formatDate(value) {
  if (!value) return "N/A";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusBadgeClass(status) {
  if (status === "Available") return "status-badge status-available";
  if (status === "Assigned") return "status-badge status-assigned";
  if (status === "Maintenance") return "status-badge status-maintenance";
  return "status-badge status-returned";
}

function AssetModal({
  isOpen,
  mode,
  form,
  setForm,
  submitting,
  onClose,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl animate-[fadeIn_.18s_ease-out]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {mode === "create" ? "Create Asset" : "Edit Asset"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "create"
                ? "Add a new asset to inventory."
                : "Update the selected asset details."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 px-6 py-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Asset Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              className="input-field"
              placeholder="Dell Latitude 7440"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                required
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                className="input-field"
              >
                {ASSET_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                required
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value }))
                }
                className="input-field"
              >
                {STATUS_OPTIONS.filter(
                  (status) => mode === "edit" || status !== "Assigned"
                ).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="input-field min-h-28 resize-none"
              placeholder="Short asset description or notes"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Purchase Date
            </label>
            <input
              type="date"
              required
              value={form.purchase_date}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  purchase_date: event.target.value,
                }))
              }
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary rounded-xl px-4 py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                !form.name.trim() ||
                !form.purchase_date ||
                !form.status
              }
              className="btn-primary rounded-xl px-4 py-3"
            >
              {submitting
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create Asset"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Assets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState(null);
  const [qrAsset, setQrAsset] = useState(null);

  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/assets", {
        params: { page, limit: 10 },
      });
      const payload = response.data || {};
      setAssets(Array.isArray(payload.data) ? payload.data : []);
      setTotalAssets(Number(payload.total) || 0);
      setPage(Number(payload.page) || 1);
      setTotalPages(Number(payload.total_pages) || 1);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail || "We could not load assets."
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    const handleRefresh = () => {
      setPage(1);
    };

    window.addEventListener("dataUpdated", handleRefresh);
    return () => window.removeEventListener("dataUpdated", handleRefresh);
  }, []);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesStatus =
        statusFilter === "All" ? true : asset.status === statusFilter;
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        asset.name.toLowerCase().includes(search) ||
        asset.asset_id?.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [assets, searchTerm, statusFilter]);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedAssetId(null);
    setForm(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (asset) => {
    setModalMode("edit");
    setSelectedAssetId(asset.id);
    setForm({
      name: asset.name || "",
      category: asset.category || "Laptop",
      description: asset.description || "",
      status: asset.status || "Available",
      purchase_date: asset.purchase_date || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAssetId(null);
    setForm(initialFormState);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name || !form.category || !form.purchase_date || !form.status) {
      toast.error("Please fill in all asset details.");
      return;
    }

    setSubmitting(true);

    try {
      if (modalMode === "create") {
        await api.post("/assets", form);
        toast.success("Asset created successfully.");
      } else {
        await api.put(`/assets/${selectedAssetId}`, form);
        toast.success("Asset updated successfully.");
      }
      closeModal();
      await loadAssets();
      window.dispatchEvent(new Event("dataUpdated"));
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.detail ||
          (modalMode === "create"
            ? "Unable to create asset."
            : "Unable to update asset.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (assetId) => {
    const confirmed = window.confirm(
      "Delete this asset? This action cannot be undone."
    );
    if (!confirmed) return;

    setDeletingAssetId(assetId);

    try {
      await api.delete(`/assets/${assetId}`);
      toast.success("Asset deleted successfully.");
      await loadAssets();
      window.dispatchEvent(new Event("dataUpdated"));
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.detail || "Unable to delete this asset."
      );
    } finally {
      setDeletingAssetId(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-panel">
        <div className="loading-spinner" />
        <h2 className="mt-5 text-xl font-semibold text-slate-900">Loading assets</h2>
        <p className="mt-2 text-sm text-slate-500">
          Fetching the latest asset inventory from the API.
        </p>
      </div>
    );
  }

  return (
    <>
      <AssetModal
        isOpen={isModalOpen}
        mode={modalMode}
        form={form}
        setForm={setForm}
        submitting={submitting}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
      <AssetQRModal asset={qrAsset} onClose={() => setQrAsset(null)} />

      <div className="space-y-6">
        {error ? (
          <div className="feedback-error">{error}</div>
        ) : null}

        <section className="card">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="section-title">Asset Inventory</h2>
              <p className="mt-1 text-sm text-slate-500">
                {isAdmin
                  ? "View and manage all tracked assets."
                  : "View assets currently assigned to you."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="input-field min-w-[220px] pl-10"
                  placeholder="Search by asset name or code"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="input-field min-w-[180px]"
              >
                <option value="All">All Statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <Link
                to="/assets/scan"
                className="btn-secondary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3"
              >
                <ScanLine className="h-4 w-4" />
                Scan QR
              </Link>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3"
                >
                  <Plus className="h-4 w-4" />
                  Create Asset
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="card overflow-hidden p-0">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="section-title">Assets</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {filteredAssets.length} asset
                  {filteredAssets.length === 1 ? "" : "s"} on page {page} of {totalPages}
                </p>
              </div>
            </div>
          </div>

          {!filteredAssets.length ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Search className="h-7 w-7 text-slate-500" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                No assets available
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Try adjusting the search or status filter, or create a new asset to
                get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="table-header">Asset ID</th>
                    <th className="table-header">Name</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Description</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Assigned To</th>
                    <th className="table-header">Purchase Date</th>
                    <th className="table-header">QR</th>
                    {isAdmin ? <th className="table-header">Actions</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="table-row">
                      <td className="table-cell font-medium text-sky-700">
                        {asset.asset_id}
                      </td>
                      <td className="table-cell font-medium text-slate-900">
                        {asset.name}
                      </td>
                      <td className="table-cell">{asset.category}</td>
                      <td className="table-cell max-w-xs">
                        <p className="truncate" title={asset.description || "No description"}>
                          {asset.description || "No description"}
                        </p>
                      </td>
                      <td className="table-cell">
                        <span className={statusBadgeClass(asset.status)}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        {asset.assigned_user?.full_name ||
                          asset.assigned_to ||
                          "Unassigned"}
                      </td>
                      <td className="table-cell">
                        {formatDate(asset.purchase_date)}
                      </td>
                      <td className="table-cell">
                        <button
                          type="button"
                          onClick={() => setQrAsset(asset)}
                          className="btn-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2"
                        >
                          <QrCode className="h-4 w-4" />
                          View QR
                        </button>
                      </td>
                      {isAdmin ? (
                        <td className="table-cell">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(asset)}
                              className="btn-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(asset.id)}
                              disabled={deletingAssetId === asset.id}
                              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              {deletingAssetId === asset.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col items-center justify-center gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="btn-secondary rounded-xl px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-600">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page >= totalPages}
              className="btn-secondary rounded-xl px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>

          <div className="border-t border-slate-100 px-6 py-3 text-center text-sm text-slate-500">
            Total assets: {totalAssets}
          </div>
        </section>
      </div>
    </>
  );
}
