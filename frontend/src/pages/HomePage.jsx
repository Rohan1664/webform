import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaClipboardList, 
  FaCheckCircle,
  FaShieldAlt,
  FaMobile,
  FaClock,
  FaUpload
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: FaClipboardList,
      title: 'Easy Form Filling',
      description: 'Fill out forms quickly with our intuitive and user-friendly interface.',
    },
    {
      icon: FaUpload,
      title: 'File Upload Support',
      description: 'Upload documents, images, and files directly through forms.',
    },
    {
      icon: FaClock,
      title: 'Save Your Progress',
      description: 'Start filling a form now and come back later to complete it.',
    },
    {
      icon: FaShieldAlt,
      title: 'Secure & Private',
      description: 'Your data is encrypted and securely stored securely.',
    },
    {
      icon: FaMobile,
      title: 'Mobile Friendly',
      description: 'Access and fill forms from any device - desktop, tablet, or mobile.',
    },
    {
      icon: FaCheckCircle,
      title: 'Instant Submission',
      description: 'Submit your forms instantly and receive confirmation right away.',
    },
  ];

  const howItWorks = [
    { step: '1', title: 'Create an Account', description: 'Sign up for free to access all available forms.' },
    { step: '2', title: 'Browse Forms', description: 'Explore forms created by administrators.' },
    { step: '3', title: 'Fill & Submit', description: 'Complete forms and submit instantly.' },
    { step: '4', title: 'Track Submissions', description: 'View your submission history anytime.' },
  ];

  return (
    <div className="space-y-20">

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="text-center lg:text-left max-w-2xl">
            
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
              <span className="block">Fill Forms,</span>
              <span className="block text-primary-600">Save Time</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-gray-600">
              A simple and secure platform to fill out and submit forms online. 
              No paper, no hassle — just complete forms from anywhere, anytime.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-center lg:justify-start">
              {isAuthenticated() ? (
                <Link to="/forms" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    Browse Available Forms
                  </Button>
                </Link>
              ) : (
                <Link to="/register" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    Get Started 
                  </Button>
                </Link>
              )}

              {/* <Link to="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link> */}
            </div>

            {/* <p className="mt-4 text-sm text-gray-500">
              No credit card required • Free forever
            </p> */}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
            Simple Process
          </h2>
          <p className="mt-2 text-2xl sm:text-4xl font-extrabold text-gray-900">
            How It Works
          </p>
          <p className="mt-4 text-gray-600 max-w-xl mx-auto">
            Get started in just a few simple steps
          </p>

          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl bg-primary-600 text-white text-lg font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
            Features
          </h2>
          <p className="mt-2 text-2xl sm:text-4xl font-extrabold text-gray-900">
            Designed for You
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 text-left"
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary-100 text-primary-600 mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 sm:grid-cols-3 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-primary-600">1000+</div>
            <div className="text-gray-600 mt-1">Forms Submitted</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-primary-600">500+</div>
            <div className="text-gray-600 mt-1">Happy Users</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-primary-600">24/7</div>
            <div className="text-gray-600 mt-1">Access Anytime</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center lg:flex lg:items-center lg:justify-between">
          
          <div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Ready to get started?
            </h2>
            <p className="mt-4 text-primary-100">
              Join thousands of users who fill forms online every day.
            </p>
          </div>

          {/* <div className="mt-8 lg:mt-0 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto bg-white text-primary-700 hover:bg-gray-100">
                Sign Up Now
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white hover:bg-primary-600">
                Sign In
              </Button>
            </Link>
          </div> */}

        </div>
      </div>

    </div>
  );
};

export default HomePage;