import Image from "next/image";

export default function SocialProof() {
  const companies = [
    { name: "Volkswagen", logo: "https://cms-images.udemycdn.com/content/tqevknj7om/svg/volkswagen_logo.svg?position=c&quality=80&x.app=portals" },
    { name: "Samsung", logo: "https://cms-images.udemycdn.com/content/2gevcc0kxt/svg/samsung_logo.svg?position=c&quality=80&x.app=portals" },
    { name: "Cisco", logo: "https://cms-images.udemycdn.com/content/mueb2ve09x/svg/cisco_logo.svg?position=c&quality=80&x.app=portals" },
    { name: "Vimeo", logo: "https://cms-images.udemycdn.com/content/ryaowrcjb2/svg/vimeo_logo_resized-2.svg?position=c&quality=80&x.app=portals" },
    { name: "Procter & Gamble", logo: "https://cms-images.udemycdn.com/content/bthyo156te/svg/procter_gamble_logo.svg?position=c&quality=80&x.app=portals" },
    { name: "HPE", logo: "https://cms-images.udemycdn.com/content/luqe0d6mx2/svg/hewlett_packard_enterprise_logo.svg?position=c&quality=80&x.app=portals" },
    { name: "Citi", logo: "https://cms-images.udemycdn.com/content/siaewwmkch/svg/citi_logo.svg?position=c&quality=80&x.app=portals" },
    { name: "Ericsson", logo: "https://cms-images.udemycdn.com/content/swmv0okrlh/svg/ericsson_logo.svg?position=c&quality=80&x.app=portals" }
  ];

  return (
    <section className="py-16 bg-white border-t border-b">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <p className="text-lg font-medium text-gray-600 mb-8">
            Trusted by professionals at leading companies worldwide
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8 items-center justify-items-center">
            {companies.map((company, index) => (
              <div
                key={index}
                className="relative w-20 h-12 opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0"
              >
                <Image
                  src={company.logo}
                  alt={company.name}
                  fill
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
            <p className="text-gray-600">Active Learners</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 mb-2">95%</div>
            <p className="text-gray-600">Completion Rate</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 mb-2">500+</div>
            <p className="text-gray-600">Expert Courses</p>
          </div>
        </div>
      </div>
    </section>
  );
}