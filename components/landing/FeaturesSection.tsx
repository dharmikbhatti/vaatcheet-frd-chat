import { MessageSquare, Users, Shield } from "lucide-react"

const features = [
  {
    icon: MessageSquare,
    title: "Real-Time Chat",
    description: "Instant messaging with real-time updates and notifications.",
  },
  {
    icon: Users,
    title: "Group Chats",
    description: "Create and manage group conversations with ease.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "End-to-end encryption for all your conversations.",
  },
]

export function FeaturesSection() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Powerful Features</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Everything you need to stay connected with your friends and family
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <feature.icon className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-slate-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
} 