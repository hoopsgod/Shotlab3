export default function PlayerWidgets() {
  return (
    <aside className="hidden xl:block w-64 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
      <div className="font-semibold text-lg mb-4">Upcoming Activities</div>

      {/* Example widget */}
      <div className="mb-6">
        <h3 className="font-medium text-sm mb-2">Next Workout</h3>
        <p className="text-sm text-gray-600">Strength training on March 15, 2026 at 5 PM</p>
      </div>

      {/* Additional widgets go here */}
    </aside>
  );
}
