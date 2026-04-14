import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Crown, Check } from "lucide-react";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    label: "₹0",
    color: "border-gray-300",
    features: ["Watch videos up to 5 minutes", "1 download per day", "Basic access"],
  },
  {
    id: "bronze",
    name: "Bronze",
    price: 1000,
    label: "₹10",
    color: "border-yellow-600",
    features: ["Watch videos up to 7 minutes", "Unlimited downloads", "Priority support"],
  },
  {
    id: "silver",
    name: "Silver",
    price: 5000,
    label: "₹50",
    color: "border-gray-400",
    features: ["Watch videos up to 10 minutes", "Unlimited downloads", "HD quality"],
  },
  {
    id: "gold",
    name: "Gold",
    price: 10000,
    label: "₹100",
    color: "border-yellow-400",
    features: ["Unlimited watch time", "Unlimited downloads", "4K quality", "All features"],
  },
];

declare global {
  interface Window { Razorpay: any; }
}

export default function UpgradePage() {
  const { user, login } = useUser();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: any) => {
    if (!user) { toast.error("Please sign in first"); return; }
    if (plan.id === "free") return;
    setLoading(plan.id);

    try {
      const orderRes = await axiosInstance.post("/payment/create-order", {
        plan: plan.id,
        userId: user._id,
      });

      const { orderId, amount, currency } = orderRes.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "YourTube",
        description: `${plan.name} Plan Upgrade`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await axiosInstance.post("/payment/verify", {
              ...response,
              userId: user._id,
              plan: plan.id,
            });
            if (verifyRes.data.success) {
              login({ ...user, plan: plan.id });
              toast.success(`Upgraded to ${plan.name} plan! Invoice sent to your email.`);
            }
          } catch {
            toast.error("Payment verification failed");
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#ef4444" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error("Payment initiation failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Crown className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
          <h1 className="text-3xl font-bold">Upgrade Your Plan</h1>
          <p className="text-gray-600 mt-2">Get more features with a premium plan</p>
          {user && (
            <p className="text-sm mt-1 text-blue-600">
              Current plan: <strong className="capitalize">{user.plan || "free"}</strong>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = (user?.plan || "free") === plan.id;
            return (
              <div
                key={plan.id}
                className={`border-2 ${plan.color} rounded-xl p-5 flex flex-col ${isCurrent ? "bg-blue-50 dark:bg-blue-950" : "bg-white dark:bg-gray-900"}`}
              >
                <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
                <p className="text-3xl font-bold mb-4">{plan.label}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                <ul className="space-y-2 flex-1 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button disabled className="w-full">Current Plan</Button>
                ) : plan.id === "free" ? (
                  <Button variant="outline" disabled className="w-full">Free</Button>
                ) : (
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={() => handleUpgrade(plan)}
                    disabled={loading === plan.id}
                  >
                    {loading === plan.id ? "Processing..." : `Upgrade to ${plan.name}`}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
