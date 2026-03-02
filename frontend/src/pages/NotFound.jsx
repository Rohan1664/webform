import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaArrowLeft } from 'react-icons/fa';
import Button from '../components/common/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md w-full">
        <div className="text-center">
          <h1 className="text-7xl sm:text-9xl font-bold text-primary-600">
            404
          </h1>

          <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900">
            Page not found
          </h2>

          <p className="mt-2 text-base sm:text-lg text-gray-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <div className="mt-8">
          <div className="card">
            <div className="card-body text-center p-6 sm:p-8">
              <div className="mx-auto h-14 w-14 sm:h-16 sm:w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl sm:text-2xl">😕</span>
              </div>

              <div className="space-y-4">
                <p className="text-sm sm:text-base text-gray-600">
                  The page you are looking for might have been removed, had its name changed,
                  or is temporarily unavailable.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <div className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      icon={FaArrowLeft}
                      onClick={() => window.history.back()}
                      className="w-full sm:w-auto"
                    >
                      Go Back
                    </Button>
                  </div>

                  <div className="w-full sm:w-auto">
                    <Link to="/" className="block w-full sm:w-auto">
                      <Button
                        variant="primary"
                        icon={FaHome}
                        className="w-full sm:w-auto"
                      >
                        Go Home
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NotFound;