import { BarChart3, LogIn, QrCode, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm fixed w-full z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              {/* Logo Section */}
              <div className="flex items-center space-x-2">
                <img
                  src="/KMA LOGO.png"
                  alt="Logo"
                  className="h-10 w-auto"
                />
                <span className="text-xl font-semibold text-gray-600">
                  KENYA MARITIME AUTHORITY
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-400 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left transform transition-all duration-500 hover:scale-105">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                <span className="block">Maritime Asset</span>
                <span className="block text-blue-400">Management System</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Streamline Kenya's maritime operations with our advanced asset
                tracking system. Ensuring efficient management of vessels,
                equipment, and port facilities across the Kenyan coastline.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left">
                <button 
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-400 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:scale-105"
                >
                  Get Started
                </button>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md transform transition-all duration-500 hover:scale-105">
                <img
                  className="w-full rounded-lg"
                  src="/working.webp"
                  alt="Team working on asset management"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Comprehensive Maritime Asset Management
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Feature 
              icon={<QrCode className="h-6 w-6" />}
              title="Asset Tracking"
              description="Track maritime assets with QR codes for instant access to vessel and equipment information."
            />
            <Feature
              icon={<BarChart3 className="h-6 w-6" />}
              title="Performance Analytics"
              description="Monitor vessel performance, maintenance schedules, and operational efficiency."
            />
            <Feature
              icon={<Shield className="h-6 w-6" />}
              title="Compliance Management"
              description="Ensure adherence to maritime regulations and safety standards."
            />
            <Feature
              icon={<Users className="h-6 w-6" />}
              title="Crew Management"
              description="Efficiently manage crew assignments, certifications, and schedules."
            />
          </div>
        </div>
      </div>

      {/* Redesigned Benefits Section */}
      <div className="bg-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Why Choose Our Platform
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Experience the advantages of modern maritime asset management
            </p>
          </div>

          <div className="space-y-24">
            {/* Industry Expertise */}
            <div className="flex flex-col lg:flex-row items-center gap-12 transform transition-all duration-500 hover:translate-x-2">
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md transform transition-all duration-500 hover:scale-105">
                <img
                  className="w-full rounded-lg"
                  src="/expertise.jpg"
                  alt="Team working on asset management"
                />
              </div>
            </div>
              <div className="lg:w-1/2 text-center lg:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Industry Expertise</h3>
                <p className="text-lg text-gray-600">Backed by years of maritime industry experience and deep understanding of local regulations. Our platform is built on real-world insights from maritime professionals.</p>
              </div>
            </div>

            {/* Real-time Updates */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12 transform transition-all duration-500 hover:translate-x-2">
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md transform transition-all duration-500 hover:scale-105">
                <img
                  className="w-full rounded-lg"
                  src="/laptop.jpg"
                  alt="Team working on asset management"
                />
              </div>
            </div>
              <div className="lg:w-1/2 text-center lg:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Real-time Updates</h3>
                <p className="text-lg text-gray-600">Stay informed with instant notifications about your maritime assets' status and location. Make informed decisions with up-to-the-minute data.</p>
              </div>
            </div>

            {/* Global Accessibility */}
            <div className="flex flex-col lg:flex-row items-center gap-12 transform transition-all duration-500 hover:translate-x-2">
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md transform transition-all duration-500 hover:scale-105">
                <img
                  className="w-full rounded-lg"
                  src="/ship.jpg"
                  alt="Team working on asset management"
                />
              </div>
            </div>
              <div className="lg:w-1/2 text-center lg:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Global Accessibility</h3>
                <p className="text-lg text-gray-600">Access your maritime asset information from anywhere in the world, at any time. Our platform ensures seamless connectivity across all maritime operations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="relative p-6 bg-white rounded-lg border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105">
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-base text-gray-500">{description}</p>
    </div>
  );
}

export default LandingPage;