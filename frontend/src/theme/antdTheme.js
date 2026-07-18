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
    colorSuccess: '#16A34A',
    colorWarning: '#D97706',
    colorError: '#DC2626',

    colorText: '#1F2937',
    colorTextSecondary: '#6B7280',
    colorTextTertiary: '#7b879b',
    colorTextQuaternary: '#9aa4b5',

    colorBorder: '#E5E7EB',
    colorBorderSecondary: '#f1f4f9',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#F5F6F8',
    colorBgElevated: '#ffffff',

    borderRadius: 6,
    borderRadiusLG: 6,
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
    Table: { headerBg: '#F5F6F8', headerColor: '#6B7280', rowHoverBg: '#eef2fb', borderColor: '#E5E7EB' },
    Menu: { itemSelectedBg: '#eef2fb', itemSelectedColor: '#2e4690', itemHeight: 40, itemBorderRadius: 6 },
    Layout: { headerBg: '#ffffff', siderBg: '#ffffff', bodyBg: '#F5F6F8' },
    Modal: { borderRadiusLG: 6 },
    Segmented: { itemSelectedBg: '#ffffff' },
    Tooltip: { colorBgSpotlight: '#1F2937' },
  },
};

export default antdTheme;
