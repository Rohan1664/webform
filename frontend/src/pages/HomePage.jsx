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
  const { isAuthenticated } = useAuth(); // Removed unused 'user' variable

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
      description: 'Your data is encrypted and securely stored with industry-standard protection.',
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
    {
      step: '1',
      title: 'Create an Account',
      description: 'Sign up for free to access all available forms.',
    },
    {
      step: '2',
      title: 'Browse Forms',
      description: 'Explore forms created by administrators for various purposes.',
    },
    {
      step: '3',
      title: 'Fill & Submit',
      description: 'Complete the forms with your information and submit them instantly.',
    },
    {
      step: '4',
      title: 'Track Submissions',
      description: 'View your submission history and track their status.',
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Fill Forms,</span>
                  <span className="block text-primary-600">Save Time</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  A simple and secure platform to fill out and submit forms online. 
                  No paper, no hassle - just complete forms from anywhere, anytime.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    {isAuthenticated() ? (
                      <Link to="/forms">
                        <Button variant="primary" size="lg">
                          Browse Available Forms
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/register">
                        <Button variant="primary" size="lg">
                          Get Started 
                        </Button>
                      </Link>
                    )}
                  </div>
                  {/* <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link to="/login">
                      <Button variant="outline" size="lg">
                        Sign In
                      </Button>
                    </Link>
                  </div> */}
                </div>
                {/* <p className="mt-3 text-sm text-gray-500 sm:mt-4">
                  No credit card required • Free forever
                </p> */}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* How It Works section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
              Simple Process
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              How It Works
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Get started in just a few simple steps
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((item) => (
                <div key={item.step} className="relative">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-600 text-white text-xl font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-base text-gray-500">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
              Features
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Designed for You
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Everything you need to fill and manage forms efficiently
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div key={index} className="relative bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600 mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-base text-gray-500">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">1000+</div>
              <div className="text-gray-600">Forms Submitted</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">500+</div>
              <div className="text-gray-600">Happy Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">24/7</div>
              <div className="text-gray-600">Access Anytime</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="block">Ready to get started?</span>
              <span className="block text-primary-200">
                Create your free account today.
              </span>
            </h2>
            <p className="mt-4 text-lg text-primary-100">
              Join thousands of users who fill forms online every day.
            </p>
          </div>
          {/* <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link to="/register">
                <Button variant="primary" size="lg" className="bg-white text-primary-700 hover:bg-gray-50">
                  Sign Up Now
                </Button>
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link to="/login">
                <Button variant="outline" size="lg" className="text-white border-white hover:bg-primary-600">
                  Sign In
                </Button>
              </Link>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default HomePage;