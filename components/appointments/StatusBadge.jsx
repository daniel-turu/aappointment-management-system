export default function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-50 text-amber-800 border-amber-200",
    approved: "bg-green-50 text-green-800 border-green-200",
    rejected: "bg-red-50 text-red-800 border-red-200",
    completed: "bg-blue-50 text-blue-800 border-blue-200",
    cancelled: "bg-zinc-100 text-zinc-600 border-zinc-200",
    no_show: "bg-orange-50 text-orange-800 border-orange-200"
  };

  const labels = {
    pending: "Pending Approval",
    approved: "Approved",
    rejected: "Rejected",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No Show"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || "bg-zinc-100 text-zinc-800 border-zinc-200"}`}>
      {labels[status] || status}
    </span>
  );
}
