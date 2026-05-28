// StatusBadge.jsx — colored pill label for plant/device status
const statusStyles = {
  'Healthy':         'bg-green-100 text-green-800',
  'Attention':       'bg-yellow-100 text-yellow-800',
  'Needs Attention': 'bg-orange-100 text-orange-800',
  'Over-saturated / Risk of Root Rot': 'bg-red-100 text-red-800',
  'Needs Water':     'bg-blue-100 text-blue-800',
  'Low Light':       'bg-purple-100 text-purple-800',
  'Low Battery':     'bg-red-100 text-red-800',
  'Offline':         'bg-gray-100 text-gray-600',
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${style}`}>
      {status}
    </span>
  );
}
