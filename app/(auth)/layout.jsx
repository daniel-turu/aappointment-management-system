export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left side - Branding/Image (FUTMinna Purple + Health Theme) */}
      <div className="hidden md:flex flex-col justify-between bg-purple-900 p-10 text-white relative overflow-hidden">
        
        {/* Subtle Health Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

        <div className="relative z-10 flex items-center space-x-4">
          <img 
            src="https://futminna.edu.ng/wp-content/uploads/2022/11/cropped-futlogo1-192x192.png" 
            alt="FUTMinna Logo" 
            className="w-16 h-16 bg-white rounded-full p-1"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">FUTMinna</h1>
            <p className="mt-1 text-purple-200 font-medium text-lg">Health Centre</p>
          </div>
        </div>

        {/* Health Centre Hero Illustration */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center my-8">
          <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden shadow-2xl border border-purple-500/20 bg-purple-950/20 backdrop-blur-sm p-4 flex items-center justify-center">
            {/* Soft glow behind the image */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 blur-2xl rounded-full transform -translate-y-4 scale-75"></div>
            <img 
              src="/health_centre_hero.png" 
              alt="Digital Health Centre Illustration" 
              className="relative z-10 w-full h-full object-cover rounded-xl transform hover:scale-105 transition-transform duration-500 ease-out"
            />
          </div>
        </div>
        
        <div className="relative z-10">
          <blockquote className="space-y-2">
            <p className="text-lg leading-relaxed">
              "Ensuring the well-being and health of the university community through an efficient, digitized medical scheduling system."
            </p>
            <footer className="text-sm text-purple-300 font-medium">— University Health Services</footer>
          </blockquote>
        </div>
      </div>
      
      {/* Right side - Forms */}
      <div className="flex items-center justify-center p-8 bg-zinc-50 relative">
        {/* Mobile Header (Shows only on small screens) */}
        <div className="md:hidden absolute top-8 left-8 flex items-center space-x-3">
            <img 
              src="https://futminna.edu.ng/wp-content/uploads/2022/11/cropped-futlogo1-192x192.png" 
              alt="FUTMinna Logo" 
              className="w-10 h-10"
            />
            <span className="font-bold text-purple-900">Health Centre</span>
        </div>
        
        <div className="w-full max-w-md space-y-8 mt-12 md:mt-0">
          {children}
        </div>
      </div>
    </div>
  )
}
