import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { t } = this.props;
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="bg-white border border-gray-200 rounded-[10px] px-8 py-10 max-w-md w-full text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('errors.boundary_title', 'Something went wrong')}</h2>
            <p className="text-gray-500 text-[15px] mb-6">{t('errors.boundary_message', 'An unexpected error occurred. Please try again.')}</p>
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              {t('errors.try_again', 'Try Again')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
