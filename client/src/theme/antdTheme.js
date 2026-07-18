/**
 * ----------------------------------------------------------------------------------
 * ANT DESIGN THEME CONFIG
 *
 * WHAT THIS FILE DOES:
 * Supplies the token object passed to antd's <ConfigProvider>. It keeps antd's own
 * runtime styling in step with the CSS custom properties in tokens.css, so component
 * internals antd renders (ripples, active states, generated colors) match the app.
 *
 * HOW IT FITS INTO THE APP:
 * Imported by App.jsx. Structural styling lives in theme/ui.css; this file only
 * covers what antd must know at runtime.
 *
 * NOTE: antd tokens cannot read CSS variables, so the brand hex values are repeated
 * here. If you change --brand-500 in tokens.css, change BRAND below to match.
 * ----------------------------------------------------------------------------------
 */

// CHANGE THIS TOGETHER WITH --brand-500 IN tokens.css
const BRAND = '#3651A5';

const antdTheme = {
  token: {
    colorPrimary: BRAND,
    colorInfo: BRAND,
    colorSuccess: '#10794b',
    colorWarning: '#d9822b',
    colorError: '#b3261e',

    colorText: '#0d1526',
    colorTextSecondary: '#48566b',
    colorTextTertiary: '#7b879b',
    colorTextQuaternary: '#9aa4b5',

    colorBorder: '#e5e9f0',
    colorBorderSecondary: '#f1f4f9',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f5f7fb',
    colorBgElevated: '#ffffff',

    borderRadius: 6,
    borderRadiusLG: 14,
    borderRadiusSM: 6,

    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: 14,

    controlHeight: 38,
    controlHeightLG: 42,
    controlHeightSM: 30,

    boxShadow: '0 6px 16px -6px rgba(11, 21, 51, 0.14), 0 2px 6px rgba(11, 21, 51, 0.05)',
    boxShadowSecondary: '0 14px 32px -12px rgba(11, 21, 51, 0.18)',

    wireframe: false,
  },

  components: {
    Button: { fontWeight: 600, primaryShadow: 'none', defaultShadow: 'none' },
    Card: { paddingLG: 20 },
    Table: { headerBg: '#f5f7fb', headerColor: '#48566b', rowHoverBg: '#eef2fb', borderColor: '#f1f4f9' },
    Menu: { itemSelectedBg: '#eef2fb', itemSelectedColor: '#2e4690', itemHeight: 40, itemBorderRadius: 6 },
    Layout: { headerBg: '#ffffff', siderBg: '#ffffff', bodyBg: '#f5f7fb' },
    Modal: { borderRadiusLG: 14 },
    Segmented: { itemSelectedBg: '#ffffff' },
    Tooltip: { colorBgSpotlight: '#0d1526' },
  },
};

export default antdTheme;
