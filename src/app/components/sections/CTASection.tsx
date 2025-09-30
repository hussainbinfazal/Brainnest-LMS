import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-48 -translate-y-48"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-48 translate-y-48"></div>

      <div className="relative container mx-auto px-4 max-w-4xl text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to start your learning journey?
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Join thousands of professionals who have transformed their careers with Brainnest. Start your free trial today.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            variant="" 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Start Free Trial
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
          >
            View Pricing
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
          <div>
            <div className="text-2xl font-bold mb-2">7-Day</div>
            <p className="text-blue-100">Free Trial</p>
          </div>
          <div>
            <div className="text-2xl font-bold mb-2">24/7</div>
            <p className="text-blue-100">Support</p>
          </div>
          <div>
            <div className="text-2xl font-bold mb-2">30-Day</div>
            <p className="text-blue-100">Money Back Guarantee</p>
          </div>
        </div>
      </div>
    </section>
  );
}