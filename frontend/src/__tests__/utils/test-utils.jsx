import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import i18n from '../mocks/i18n';

/**
 * Custom render function that wraps components with all necessary providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {string} [options.locale] - Locale to use (en, lt, ru)
 * @returns {Object} - RTL render result
 */
function customRender(ui, options = {}) {
  const { locale, ...renderOptions } = options;

  // Change locale if provided
  if (locale) {
    i18n.changeLanguage(locale);
  }

  return render(
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </I18nextProvider>,
    renderOptions
  );
}

// Re-export everything from RTL
export * from '@testing-library/react';

// Override render with custom render
export { customRender as render };
