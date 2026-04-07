import React, { useState } from 'react';
import { Form, Input, Button, Select, Checkbox, message } from 'antd';
import { GlobalOutlined, RocketOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { mockDepartments } from '../../services/mockData';

const RegisterPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isAr = i18n.language === 'ar';

  const toggleLanguage = () => {
    i18n.changeLanguage(isAr ? 'en' : 'ar');
  };

  const handleSubmit = async (values: Record<string, string>) => {
    setLoading(true);
    try {
      await register({ email: values.email, nameEn: values.nameEn, nameAr: values.nameAr });
      message.success(t('auth.accountCreatedSuccess'));
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

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
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <RocketOutlined style={{ fontSize: 64, color: '#D4AF37', marginBottom: 24 }} />
          <h1 style={{ color: '#D4AF37', fontSize: 36, fontWeight: 700, margin: '0 0 12px' }}>
            Jordan Aviation
          </h1>
          <p style={{ color: '#fff', fontSize: 18, opacity: 0.9, marginBottom: 16 }}>
            {isAr ? 'انضم إلى نظام إدارة الإجازات الذكي' : 'Join Smart Leave Management'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, maxWidth: 320 }}>
            {isAr
              ? 'سجّل حسابك للوصول إلى نظام إدارة إجازات المرض الخاص بك.'
              : 'Register your account to access the sick leave management system.'}
          </p>
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
          overflowY: 'auto',
        }}
      >
        <div style={{ position: 'absolute', top: 24, right: isAr ? 'auto' : 24, left: isAr ? 24 : 'auto' }}>
          <Button icon={<GlobalOutlined />} onClick={toggleLanguage} size="small">
            {isAr ? 'English' : 'العربية'}
          </Button>
        </div>

        <div style={{ width: '100%', maxWidth: 420, animation: 'slideIn 0.5s ease-out' }}>
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
              {isAr ? 'إنشاء حساب' : 'Create Account'}
            </h2>
            <p style={{ color: '#8c8c8c', marginBottom: 24, textAlign: isAr ? 'right' : 'left' }}>
              {isAr ? 'أدخل بياناتك للتسجيل' : 'Enter your details to register'}
            </p>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
              size="large"
            >
              <Form.Item
                name="employeeNumber"
                label={t('auth.employeeNumber')}
                rules={[{ required: true, message: t('common.required') }]}
              >
                <Input placeholder="EMP-XXX" style={{ borderRadius: 8 }} />
              </Form.Item>

              <Form.Item
                name="nameEn"
                label={t('auth.fullNameEn')}
                rules={[{ required: true, message: t('common.required') }]}
              >
                <Input placeholder="Full Name in English" style={{ borderRadius: 8 }} />
              </Form.Item>

              <Form.Item
                name="nameAr"
                label={t('auth.fullNameAr')}
                rules={[{ required: true, message: t('common.required') }]}
              >
                <Input placeholder="الاسم الكامل بالعربية" style={{ borderRadius: 8 }} dir="rtl" />
              </Form.Item>

              <Form.Item
                name="email"
                label={t('auth.companyEmail')}
                rules={[
                  { required: true, message: t('common.required') },
                  { type: 'email', message: t('auth.invalidEmail') },
                  {
                    validator: (_, val) =>
                      !val || val.endsWith('@jordanaviation.jo')
                        ? Promise.resolve()
                        : Promise.reject(t('auth.invalidEmail')),
                  },
                ]}
              >
                <Input placeholder="name@jordanaviation.jo" style={{ borderRadius: 8 }} />
              </Form.Item>

              <Form.Item
                name="department"
                label={t('auth.department')}
                rules={[{ required: true, message: t('common.required') }]}
              >
                <Select placeholder={t('auth.selectDepartment')} style={{ borderRadius: 8 }}>
                  {mockDepartments.map((d) => (
                    <Select.Option key={d.id} value={d.id}>
                      {isAr ? d.nameAr : d.nameEn}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="password"
                label={t('auth.password')}
                rules={[
                  { required: true, message: t('common.required') },
                  { min: 8, message: t('auth.passwordRequirements') },
                ]}
              >
                <Input.Password style={{ borderRadius: 8 }} />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label={t('auth.confirmPassword')}
                dependencies={['password']}
                rules={[
                  { required: true, message: t('common.required') },
                  ({ getFieldValue }) => ({
                    validator(_, val) {
                      if (!val || getFieldValue('password') === val) return Promise.resolve();
                      return Promise.reject(isAr ? 'كلمتا المرور غير متطابقتان' : 'Passwords do not match');
                    },
                  }),
                ]}
              >
                <Input.Password style={{ borderRadius: 8 }} />
              </Form.Item>

              <Form.Item
                name="agree"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, val) =>
                      val
                        ? Promise.resolve()
                        : Promise.reject(isAr ? 'يجب الموافقة على السياسات' : 'You must agree to policies'),
                  },
                ]}
              >
                <Checkbox>
                  {isAr ? 'أوافق على سياسات الشركة' : 'I agree to company policies'}
                </Checkbox>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className="btn-gold"
                  style={{ borderRadius: 8, height: 48, fontWeight: 600, fontSize: 16 }}
                >
                  {isAr ? 'إنشاء الحساب' : 'Create Account'}
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', fontSize: 13, color: '#8c8c8c' }}>
              {t('auth.alreadyHaveAccount')}{' '}
              <Link to="/login" style={{ color: '#D4AF37', fontWeight: 500 }}>
                {t('auth.loginHere')}
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

export default RegisterPage;
