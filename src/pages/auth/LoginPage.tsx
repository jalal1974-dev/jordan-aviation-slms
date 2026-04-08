import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Divider, message } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  GlobalOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types';

const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isAr = i18n.language === 'ar';

  const toggleLanguage = () => {
    const newLang = isAr ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  const getDashboard = (role: UserRole) => {
    if (role === 'EMPLOYEE') return '/employee/dashboard';
    if (role === 'COMPANY_DOCTOR') return '/doctor/dashboard';
    return '/admin/dashboard';
  };

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const success = await login(values.email, values.password);
      if (success) {
        const user = useAuthStore.getState().user;
        if (user) navigate(getDashboard(user.role));
      } else {
        message.error(isAr ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email: string) => {
    form.setFieldsValue({ email, password: 'Test1234' });
  };

  const features = [
    { icon: <RobotOutlined />, en: 'AI Document Analysis', ar: 'تحليل المستندات بالذكاء الاصطناعي' },
    { icon: <SafetyCertificateOutlined />, en: 'Secure & Compliant', ar: 'آمن ومتوافق مع المعايير' },
    { icon: <TranslationOutlined />, en: 'Bilingual Support', ar: 'دعم ثنائي اللغة' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* LEFT SIDE */}
      <div
        className="login-left-panel"
        style={{
          width: '60%',
          background: 'linear-gradient(135deg, #001529 0%, #003a70 50%, #D4AF37 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 40px',
          position: 'relative',
        }}
      >
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.8s ease-out' }}>
          <img src="/logo.png" alt="Jordan Aviation" style={{ width: 150, height: 'auto', marginBottom: 16 }} />
          <h1 style={{ color: '#D4AF37', fontSize: 36, fontWeight: 700, margin: '0 0 12px' }}>
            Jordan Aviation
          </h1>
          <p style={{ color: '#fff', fontSize: 18, margin: '0 0 60px', opacity: 0.9 }}>
            {isAr ? 'نظام إدارة إجازات المرض' : 'Sick Leave Management System'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 40 }}>
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: '16px 24px',
                  flexDirection: isAr ? 'row-reverse' : 'row',
                }}
              >
                <span style={{ fontSize: 24, color: '#D4AF37' }}>{f.icon}</span>
                <span style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>
                  {isAr ? f.ar : f.en}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 30, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
          © 2024 Jordan Aviation — Human Resources Department
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div
        className="login-right-panel"
        style={{
          width: '40%',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          position: 'relative',
        }}
      >
        {/* Language toggle */}
        <div style={{ position: 'absolute', top: 24, right: isAr ? 'auto' : 24, left: isAr ? 24 : 'auto' }}>
          <Button icon={<GlobalOutlined />} onClick={toggleLanguage} size="small">
            {isAr ? 'English' : 'العربية'}
          </Button>
        </div>

        <div style={{ width: '100%', maxWidth: 400, animation: 'slideIn 0.5s ease-out' }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
              padding: '40px 32px',
            }}
          >
            <h2
              style={{
                color: '#001529',
                fontSize: 24,
                fontWeight: 700,
                margin: '0 0 8px',
                textAlign: isAr ? 'right' : 'left',
              }}
            >
              {isAr ? 'مرحباً بعودتك' : 'Welcome Back'}
            </h2>
            <p
              style={{
                color: '#8c8c8c',
                marginBottom: 28,
                textAlign: isAr ? 'right' : 'left',
              }}
            >
              {isAr ? 'سجل الدخول إلى حسابك' : 'Sign in to your account'}
            </p>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
              size="large"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: t('common.required') },
                  { type: 'email', message: t('auth.invalidEmail') },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="employee@jordanaviation.jo"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: t('common.required') },
                  { min: 6, message: isAr ? 'كلمة المرور قصيرة جداً' : 'Password too short' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder={isAr ? 'كلمة المرور' : 'Password'}
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Form.Item name="rememberMe" valuePropName="checked" noStyle>
                    <Checkbox>{t('auth.rememberMe')}</Checkbox>
                  </Form.Item>
                  <a style={{ color: '#D4AF37', fontWeight: 500 }} href="#">
                    {t('auth.forgotPassword')}
                  </a>
                </div>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  size="large"
                  className="btn-gold"
                  style={{ borderRadius: 8, height: 48, fontWeight: 600, fontSize: 16 }}
                >
                  {isAr ? 'تسجيل الدخول' : 'Sign In'}
                </Button>
              </Form.Item>
            </Form>

            <Divider style={{ color: '#8c8c8c', fontSize: 12 }}>{isAr ? 'أو' : 'Or'}</Divider>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button
                block
                size="large"
                onClick={() => quickLogin('employee@jordanaviation.jo')}
                style={{ borderRadius: 8, textAlign: isAr ? 'right' : 'left' }}
              >
                👤 {isAr ? 'دخول كموظف (أحمد)' : 'Login as Employee (Ahmed)'}
              </Button>
              <Button
                block
                size="large"
                onClick={() => quickLogin('doctor@jordanaviation.jo')}
                style={{ borderRadius: 8, textAlign: isAr ? 'right' : 'left' }}
              >
                🩺 {isAr ? 'دخول كطبيب (د. جلال)' : 'Login as Company Doctor (Dr. Jalal)'}
              </Button>
              <Button
                block
                size="large"
                onClick={() => quickLogin('admin@jordanaviation.jo')}
                style={{ borderRadius: 8, textAlign: isAr ? 'right' : 'left' }}
              >
                📋 {isAr ? 'دخول كمدير موارد بشرية (رانيا)' : 'Login as HR Manager (Rania)'}
              </Button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#8c8c8c' }}>
              {t('auth.newEmployee')}{' '}
              <Link to="/register" style={{ color: '#D4AF37', fontWeight: 500 }}>
                {t('auth.registerHere')}
              </Link>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#bfbfbf' }}>
            © 2024 Jordan Aviation
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
