import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, Target, Award, Clock, Users } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast Learning",
      description: "Accelerated learning paths designed to get you job-ready in record time",
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      icon: Shield,
      title: "Industry Certified",
      description: "Get certificates recognized by top companies and industry leaders",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: Target,
      title: "Personalized Paths",
      description: "AI-powered recommendations tailored to your career goals and skill level",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Award,
      title: "Expert Instructors",
      description: "Learn from industry professionals with real-world experience",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: Clock,
      title: "Learn at Your Pace",
      description: "Flexible scheduling that fits your lifestyle and commitments",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Join a thriving community of learners and get peer support",
      color: "bg-pink-100 text-pink-600"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <Badge variant="" className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200">
            Why Choose Brainnest
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              succeed
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our platform combines cutting-edge technology with proven teaching methods to deliver exceptional learning outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md"
            >
              <CardContent className="p-8">
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}