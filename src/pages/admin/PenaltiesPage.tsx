import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Typography,
  Modal,
  Form,
  Popconfirm,
  notification,
  Space,
  Alert,
  Spin,
  message,
} from 'antd';
import {
  ExclamationCircleOutlined,
  SearchOutlined,
  ClearOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { penaltiesAPI, employeesAPI, leavesAPI } from '../../services/api';
import type { User } from '../../types';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface PenaltyRow {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNameAr: string;
  employeeNumber: string;
  leaveRef: string;
  leaveId: string;
  violationNumber: number;
  penaltyType: string;
  penaltyDays?: number;
  description: string;
  date: Date;
  appliedBy: string;
  revoked: boolean;
}

const VIOLATION_INFO: Record<number, { label: string; labelAr: string; penaltyEn: string; penaltyAr: string; color: string; days?: number }> = {
  1: { label: '1st Violation', labelAr: 'المخالفة الأولى', penaltyEn: '2 work days salary deduction', penaltyAr: 'خصم راتب يومين', color: 'orange', days: 2 },
  2: { label: '2nd Violation', labelAr: 'المخالفة الثانية', penaltyEn: 'Written Warning (إنذار)', penaltyAr: 'إنذار كتابي', color: 'red' },
  3: { label: '3rd Violation', labelAr: 'المخالفة الثالثة', penaltyEn: 'Final Warning (إنذار نهائي)', penaltyAr: 'إنذار نهائي', color: '#8b0000' },
};

const buildRows = (apiPenalties: any[]): PenaltyRow[] =>
  apiPenalties.map((p) => ({
    id: p.id,
    employeeId: p.employeeId ?? p.employee?.id ?? '',
    employeeName: p.employee?.nameEn ?? p.employeeName ?? 'Unknown',
    employeeNameAr: p.employee?.nameAr ?? p.employeeNameAr ?? '',
    employeeNumber: p.employee?.employeeNumber ?? p.employeeNumber ?? '',
    leaveRef: p.leave?.refNumber ?? p.leaveRef ?? '—',
    leaveId: p.leaveId ?? p.leave?.id ?? '',
    violationNumber: p.violationNumber ?? 1,
    penaltyType: p.penaltyType ?? '',
    penaltyDays: p.penaltyDays,
    description: p.description ?? p.notes ?? '',
    date: p.date ?? p.createdAt ?? new Date(),
    appliedBy: p.appliedBy ?? p.appliedByName ?? 'System',
    revoked: p.revoked ?? false,
  }));

const StatCard: React.FC<{ title: string; value: number; accentColor: string }> = ({
  title, value, accentColor,
}) => (
  <Card
    size="small"
    style={{ borderRadius: 10, borderTop: `3px solid ${accentColor}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
  >
    <Text type="secondary" style={{ fontSize: 12 }}>{title}</Text>
    <div style={{ fontSize: 26, fontWeight: 800, color: accentColor }}>{value}</div>
  </Card>
);

const PenaltiesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [penalties, setPenalties] = useState<PenaltyRow[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterViolation, setFilterViolation] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [violationType, setViolationType] = useState<number | null>(null);
  const [form] = Form.useForm();

  const fetchPenalties = () => {
    penaltiesAPI.getAll()
      .then((r) => {
        const data = r.data?.data ?? r.data ?? [];
        setPenalties(buildRows(Array.isArray(data) ? data : []));
      })
      .catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      penaltiesAPI.getAll().then((r) => {
        const data = r.data?.data ?? r.data ?? [];
        setPenalties(buildRows(Array.isArray(data) ? data : []));
      }),
      employeesAPI.getAll().then((r) => {
        const data = r.data?.data ?? r.data ?? [];
        setEmployees(Array.isArray(data) ? data : []);
      }),
      leavesAPI.getAll().then((r) => {
        const data = r.data?.data ?? r.data ?? [];
        setAllLeaves(Array.isArray(data) ? data : []);
      }),
    ])
      .catch(() => message.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return penalties.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.employeeName.toLowerCase().includes(q) && !p.leaveRef.toLowerCase().includes(q)) return false;
      }
      if (filterViolation && String(p.violationNumber) !== filterViolation) return false;
      return true;
    });
  }, [penalties, search, filterViolation]);

  const countByViolation = (n: number) => penalties.filter((p) => p.violationNumber === n && !p.revoked).length;

  const employeeLeaves = useMemo(
    () => allLeaves.filter((l) => l.employeeId === selectedEmployee),
    [allLeaves, selectedEmployee]
  );

  const openModal = () => {
    form.resetFields();
    setViolationType(null);
    setSelectedEmployee('');
    setModalOpen(true);
  };

  const handleApply = () => {
    form.validateFields().then((values) => {
      const employee = employees.find((u) => u.id === values.employeeId);
      const leave = allLeaves.find((l) => l.id === values.leaveId);
      const info = VIOLATION_INFO[values.violationType];
      if (!employee || !leave || !info) return;

      penaltiesAPI.apply({
        employeeId: employee.id,
        leaveId: leave.id,
        violationNumber: values.violationType,
        penaltyType: info.penaltyEn,
        penaltyDays: info.days,
        description: values.notes ?? info.penaltyEn,
      })
        .then(() => {
          fetchPenalties();
          notification.success({ message: t('penPage.applySuccess') });
          setModalOpen(false);
        })
        .catch(() => {
          const newPenalty: PenaltyRow = {
            id: `pen-${Date.now()}`,
            employeeId: employee.id,
            employeeName: employee.nameEn,
            employeeNameAr: employee.nameAr,
            employeeNumber: employee.employeeNumber ?? '',
            leaveRef: leave.refNumber,
            leaveId: leave.id,
            violationNumber: values.violationType,
            penaltyType: info.penaltyEn,
            penaltyDays: info.days,
            description: values.notes ?? info.penaltyEn,
            date: new Date(),
            appliedBy: 'System',
            revoked: false,
          };
          setPenalties((prev) => [newPenalty, ...prev]);
          notification.success({ message: t('penPage.applySuccess') });
          setModalOpen(false);
        });
    });
  };

  const revokePenalty = (id: string) => {
    penaltiesAPI.revoke(id)
      .then(() => {
        setPenalties((prev) => prev.map((p) => (p.id === id ? { ...p, revoked: true } : p)));
        notification.success({ message: t('penPage.revokeSuccess') });
      })
      .catch(() => {
        setPenalties((prev) => prev.map((p) => (p.id === id ? { ...p, revoked: true } : p)));
        notification.success({ message: t('penPage.revokeSuccess') });
      });
  };

  const expandedRowRender = (record: PenaltyRow) => {
    const info = VIOLATION_INFO[record.violationNumber];
    return (
      <div style={{ padding: '8px 24px', background: '#fafafa' }}>
        <Row gutter={[24, 8]}>
          <Col xs={24} md={8}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
              {t('penPage.violationDetails')}
            </Text>
            <div style={{ fontSize: 12 }}>
              <div>{t('penPage.violationType')}: <Text strong>{isAr ? info?.labelAr : info?.label}</Text></div>
              <div>{t('penPage.penaltyApplied')}: <Text strong style={{ color: info?.color }}>{isAr ? info?.penaltyAr : info?.penaltyEn}</Text></div>
              {record.penaltyDays && (
                <div>{t('penPage.deductionDays')}: <Text strong style={{ color: '#ff4d4f' }}>{record.penaltyDays} {t('penPage.days')}</Text></div>
              )}
            </div>
          </Col>
          <Col xs={24} md={8}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
              {t('penPage.relatedLeave')}
            </Text>
            <div style={{ fontSize: 12 }}>
              <div>{t('penPage.leaveRef')}: <Text style={{ color: '#D4AF37', fontWeight: 600 }}>{record.leaveRef}</Text></div>
              <div>{t('penPage.description')}: <Text>{record.description}</Text></div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
              {t('penPage.appliedInfo')}
            </Text>
            <div style={{ fontSize: 12 }}>
              <div>{t('penPage.appliedBy')}: <Text strong>{record.appliedBy}</Text></div>
              <div>{t('penPage.appliedDate')}: <Text>{new Date(record.date).toLocaleDateString('en-GB')}</Text></div>
              {record.revoked && <Tag color="default" style={{ marginTop: 4 }}>REVOKED</Tag>}
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  const columns = [
    {
      title: t('penPage.employee'),
      key: 'employee',
      render: (_: unknown, r: PenaltyRow) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{isAr ? r.employeeNameAr : r.employeeName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{r.employeeNumber}</Text>
        </div>
      ),
    },
    {
      title: t('penPage.leaveRef'),
      dataIndex: 'leaveRef',
      key: 'ref',
      render: (ref: string) => <Text style={{ color: '#D4AF37', fontWeight: 600 }}>{ref}</Text>,
    },
    {
      title: t('penPage.violationNum'),
      dataIndex: 'violationNumber',
      key: 'vnum',
      render: (n: number) => {
        const info = VIOLATION_INFO[n];
        return (
          <Tag color={info?.color ?? 'default'} style={{ fontSize: 11 }}>
            {isAr ? info?.labelAr : info?.label}
          </Tag>
        );
      },
    },
    {
      title: t('penPage.penaltyType'),
      key: 'penalty',
      render: (_: unknown, r: PenaltyRow) => {
        const info = VIOLATION_INFO[r.violationNumber];
        return (
          <Text style={{ fontSize: 12, color: info?.color ?? undefined }}>
            {isAr ? info?.penaltyAr : info?.penaltyEn}
          </Text>
        );
      },
    },
    {
      title: t('penPage.deductionDays'),
      dataIndex: 'penaltyDays',
      key: 'days',
      render: (d?: number) => (
        <Text style={{ color: d ? '#ff4d4f' : '#8c8c8c' }}>{d ? `${d} ${t('penPage.days')}` : 'N/A'}</Text>
      ),
    },
    {
      title: t('penPage.appliedDate'),
      dataIndex: 'date',
      key: 'date',
      render: (d: Date) => new Date(d).toLocaleDateString('en-GB'),
    },
    {
      title: t('penPage.appliedBy'),
      dataIndex: 'appliedBy',
      key: 'by',
      render: (by: string) => <Text style={{ fontSize: 12 }}>{by}</Text>,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      fixed: 'right' as const,
      render: (_: unknown, r: PenaltyRow) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />}>{t('penPage.viewDetails')}</Button>
          {!r.revoked && (
            <Popconfirm
              title={t('penPage.revokeConfirm')}
              onConfirm={() => revokePenalty(r.id)}
              okText={t('penPage.revokeOk')}
              cancelText={t('common.cancel')}
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger>{t('penPage.revoke')}</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;

  return (
    <div className="fade-in" style={{ padding: '0 0 32px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: '#001529' }}>
            <ExclamationCircleOutlined style={{ marginInlineEnd: 10, color: '#D4AF37' }} />
            {t('penPage.title')}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('penPage.subtitle')}
          </Text>
        </div>
        <Button
          icon={<PlusOutlined />}
          onClick={openModal}
          style={{ background: '#D4AF37', borderColor: '#D4AF37', color: '#fff', fontWeight: 600 }}
        >
          {t('penPage.applyPenalty')}
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <StatCard title={t('penPage.totalViolations')} value={penalties.filter((p) => !p.revoked).length} accentColor="#ff4d4f" />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard title={t('penPage.firstViolations')} value={countByViolation(1)} accentColor="#fa8c16" />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard title={t('penPage.secondViolations')} value={countByViolation(2)} accentColor="#ff4d4f" />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard title={t('penPage.thirdViolations')} value={countByViolation(3)} accentColor="#8b0000" />
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ borderRadius: 10, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={10}>
            <Input
              placeholder={t('penPage.searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={7} md={6}>
            <Select
              placeholder={t('penPage.filterViolation')}
              value={filterViolation || undefined}
              onChange={setFilterViolation}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="1">{t('penPage.firstViolations')}</Option>
              <Option value="2">{t('penPage.secondViolations')}</Option>
              <Option value="3">{t('penPage.thirdViolations')}</Option>
            </Select>
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Button icon={<ClearOutlined />} onClick={() => { setSearch(''); setFilterViolation(''); }}>
              {t('penPage.clear')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          expandable={{ expandedRowRender }}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 900 }}
          size="small"
          rowClassName={(r) => (r.revoked ? 'row-revoked' : '')}
        />
      </Card>

      <style>{`.row-revoked td { opacity: 0.45; }`}</style>

      {/* Apply Penalty Modal */}
      <Modal
        title={
          <span style={{ color: '#001529', fontWeight: 700 }}>
            {t('penPage.applyPenalty')}
          </span>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={580}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="employeeId"
            label={t('penPage.selectEmployee')}
            rules={[{ required: true, message: t('penPage.employeeRequired') }]}
          >
            <Select
              showSearch
              placeholder={t('penPage.selectEmployeePlaceholder')}
              optionFilterProp="children"
              onChange={(val) => {
                setSelectedEmployee(val);
                form.setFieldValue('leaveId', undefined);
              }}
            >
              {employees.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.nameEn} ({u.employeeNumber})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="leaveId"
            label={t('penPage.relatedLeave')}
            rules={[{ required: true, message: t('penPage.leaveRequired') }]}
          >
            <Select
              placeholder={t('penPage.selectLeave')}
              disabled={!selectedEmployee}
            >
              {employeeLeaves.map((l) => (
                <Option key={l.id} value={l.id}>
                  {l.refNumber} — {l.status}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="violationType"
            label={t('penPage.violationTypeLabel')}
            rules={[{ required: true, message: t('penPage.violationRequired') }]}
          >
            <Select
              placeholder={t('penPage.selectViolationType')}
              onChange={(val) => setViolationType(val)}
            >
              <Option value={1}>{t('penPage.firstViolations')}</Option>
              <Option value={2}>{t('penPage.secondViolations')}</Option>
              <Option value={3}>{t('penPage.thirdViolations')}</Option>
            </Select>
          </Form.Item>

          {violationType && (
            <Alert
              type={violationType === 1 ? 'warning' : 'error'}
              style={{ marginBottom: 16 }}
              message={
                <div>
                  <Text strong style={{ color: VIOLATION_INFO[violationType].color, fontSize: 14 }}>
                    {isAr ? VIOLATION_INFO[violationType].penaltyAr : VIOLATION_INFO[violationType].penaltyEn}
                  </Text>
                  {VIOLATION_INFO[violationType].days && (
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {t('penPage.deductionDays')}: <strong>{VIOLATION_INFO[violationType].days} {t('penPage.days')}</strong>
                    </div>
                  )}
                </div>
              }
            />
          )}

          <Form.Item name="notes" label={t('penPage.notes')}>
            <TextArea rows={3} placeholder={t('penPage.notesPlaceholder')} />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button danger type="primary" onClick={handleApply}>
              {t('penPage.applyPenalty')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PenaltiesPage;
