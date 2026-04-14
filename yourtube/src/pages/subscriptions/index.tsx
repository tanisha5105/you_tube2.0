import { PlaySquare } from "lucide-react";

export default function SubscriptionsPage() {
  return (
    <main className="flex-1 p-6">
      <h1 className="text-2xl font-bold mb-6">Subscriptions</h1>
      <div className="text-center py-12">
        <PlaySquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No subscriptions yet</h2>
        <p className="text-gray-500">Subscribe to channels to see their videos here.</p>
      </div>
    </main>
  );
}
