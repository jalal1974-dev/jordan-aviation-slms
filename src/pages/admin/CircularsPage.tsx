import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  List,
  Tag,
  Button,
  Input,
  Select,
  Typography,
  Modal,
  Form,
  Switch,
  Popconfirm,
  notification,
  Space,
  Divider,
  Spin,
} from 'antd';
import {
  NotificationOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ClearOutlined,
  FileTextOutlined,
  WarningOutlined,
  BellOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { circularsAPI } from '../../services/api';
import type { CircularType } from '../../types';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface CircularItem {
  id: string;
  refNumber: string;
  title: string;
  titleAr: string;
  type: CircularType;
  date: Date;
  content: string;
  contentAr: string;
  isActive: boolean;
  publishedBy: string;
}

const TYPE_CONFIG: Record<CircularType, { color: string; icon: React.ReactNode }> = {
  POLICY_UPDATE: { color: 'blue', icon: <FileTextOutlined /> },
  FACILITY_BLACKLIST: { color: 'purple', icon: <StopOutlined /> },
  REMINDER: { color: 'orange', icon: <BellOutlined /> },
  ANNOUNCEMENT: { color: 'green', icon: <NotificationOutlined /> },
};

const WARN_TYPE_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  ...TYPE_CONFIG,
  WARNING: { color: 'red', icon: <WarningOutlined /> },
};


const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const CircularsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [circulars, setCirculars] = useState<CircularItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<CircularItem | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [form] = Form.useForm();

  const fetchCirculars = async () => {
    try {
      const res = await circularsAPI.getAll();
      const data = res.data?.data ?? res.data ?? [];
      setCirculars(Array.isArray(data) ? data : []);
    } catch {
      /* keep existing state */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCirculars(); }, []);

  const filtered = circulars.filter((c) => {
    const q = search.toLowerCase();
    if (search && !c.title.toLowerCase().includes(q) && !c.titleAr.includes(q) && !c.refNumber.toLowerCase().includes(q))
      return false;
    if (filterType && c.type !== filterType) return false;
    if (filterStatus === 'active' && !c.isActive) return false;
    if (filterStatus === 'inactive' && c.isActive) return false;
    return true;
  });

  const openCreate = () => {
    setEditItem(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setModalOpen(true);
  };

  const openEdit = (item: CircularItem) => {
    setEditItem(item);
    form.setFieldsValue({
      title: item.title,
      titleAr: item.titleAr,
      content: item.content,
      contentAr: item.contentAr,
      type: item.type,
      isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    form.validateFields().then(async (values) => {
      try {
        if (editItem) {
          await circularsAPI.update(editItem.id, values);
          notification.success({ message: t('cirPage.updateSuccess') });
        } else {
          await circularsAPI.create(values);
          notification.success({ message: t('cirPage.publishSuccess') });
        }
        await fetchCirculars();
        setModalOpen(false);
      } catch {
        notification.error({ message: 'Operation failed' });
      }
    });
  };

  const toggleActive = async (id: string) => {
    const item = circulars.find((c) => c.id === id);
    if (!item) return;
    setCirculars((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
    try {
      await circularsAPI.update(id, { isActive: !item.isActive });
    } catch {
      setCirculars((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: item.isActive } : c))
      );
    }
  };

  const deleteCircular = async (id: string) => {
    try {
      await circularsAPI.delete(id);
      setCirculars((prev) => prev.filter((c) => c.id !== id));
      notification.success({ message: t('cirPage.deleteSuccess') });
    } catch {
      notification.error({ message: 'Delete failed' });
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getTypeColor = (type: string) =>
    (WARN_TYPE_CONFIG[type] ?? TYPE_CONFIG['ANNOUNCEMENT']).color;

  const getTypeIcon = (type: string) =>
    (WARN_TYPE_CONFIG[type] ?? TYPE_CONFIG['ANNOUNCEMENT']).icon;

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      POLICY_UPDATE: t('circularTypes.policyUpdate'),
      FACILITY_BLACKLIST: t('circularTypes.facilityBlacklist'),
      REMINDER: t('circularTypes.reminder'),
      ANNOUNCEMENT: t('circularTypes.announcement'),
    };
    return map[type] ?? type;
  };

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
            <NotificationOutlined style={{ marginInlineEnd: 10, color: '#D4AF37' }} />
            {t('cirPage.title')}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('cirPage.subtitle')}
          </Text>
        </div>
        <Button
          icon={<PlusOutlined />}
          onClick={openCreate}
          style={{ background: '#D4AF37', borderColor: '#D4AF37', color: '#fff', fontWeight: 600 }}
        >
          {t('cirPage.newCircular')}
        </Button>
      </div>

      {/* Filters */}
      <Card
        size="small"
        style={{ borderRadius: 10, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
      >
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={10} md={8}>
            <Input
              placeholder={t('cirPage.searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select
              placeholder={t('cirPage.filterType')}
              value={filterType || undefined}
              onChange={setFilterType}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="POLICY_UPDATE">{t('circularTypes.policyUpdate')}</Option>
              <Option value="FACILITY_BLACKLIST">{t('circularTypes.facilityBlacklist')}</Option>
              <Option value="REMINDER">{t('circularTypes.reminder')}</Option>
              <Option value="ANNOUNCEMENT">{t('circularTypes.announcement')}</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select
              placeholder={t('cirPage.filterStatus')}
              value={filterStatus || undefined}
              onChange={setFilterStatus}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="active">{t('cirPage.activeStatus')}</Option>
              <Option value="inactive">{t('cirPage.inactiveStatus')}</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4} md={3}>
            <Button
              icon={<ClearOutlined />}
              onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); }}
            >
              {t('cirPage.clear')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* List */}
      <Spin spinning={loading}>
      <List
        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
        dataSource={filtered}
        locale={{ emptyText: t('cirPage.noResults') }}
        renderItem={(item) => {
          const isExpanded = expanded.has(item.id);
          const displayContent = isAr ? item.contentAr : item.content;
          const displayTitle = isAr ? item.titleAr : item.title;
          return (
            <List.Item>
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                  borderTop: `3px solid ${
                    getTypeColor(item.type) === 'blue' ? '#1890ff'
                    : getTypeColor(item.type) === 'purple' ? '#722ed1'
                    : getTypeColor(item.type) === 'orange' ? '#fa8c16'
                    : getTypeColor(item.type) === 'red' ? '#ff4d4f'
                    : '#52c41a'
                  }`,
                  opacity: item.isActive ? 1 : 0.7,
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <Space size={6}>
                    <span style={{ fontSize: 16, color: '#D4AF37' }}>{getTypeIcon(item.type)}</span>
                    <Tag color={getTypeColor(item.type)} style={{ fontSize: 11 }}>
                      {typeLabel(item.type)}
                    </Tag>
                  </Space>
                  <Tag color={item.isActive ? 'green' : 'default'} style={{ fontSize: 11 }}>
                    {item.isActive ? t('cirPage.activeStatus') : t('cirPage.inactiveStatus')}
                  </Tag>
                </div>

                {/* Title */}
                <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
                  {displayTitle}
                </Text>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
                  {item.refNumber} · {formatDate(item.date)} · {item.publishedBy}
                </Text>

                <Divider style={{ margin: '8px 0' }} />

                {/* Content */}
                <Paragraph
                  style={{ fontSize: 12, color: '#595959', margin: 0 }}
                  ellipsis={!isExpanded ? { rows: 2 } : false}
                >
                  {displayContent}
                </Paragraph>
                {displayContent.length > 120 && (
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, fontSize: 11, color: '#D4AF37' }}
                    onClick={() => toggleExpand(item.id)}
                  >
                    {isExpanded ? t('cirPage.showLess') : t('cirPage.readMore')}
                  </Button>
                )}

                <Divider style={{ margin: '8px 0' }} />

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(item)}>
                    {t('cirPage.edit')}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => toggleActive(item.id)}
                    style={item.isActive ? { color: '#8c8c8c', borderColor: '#d9d9d9' } : { color: '#52c41a', borderColor: '#52c41a' }}
                  >
                    {item.isActive ? t('cirPage.deactivate') : t('cirPage.activate')}
                  </Button>
                  <Popconfirm
                    title={t('cirPage.deleteConfirm')}
                    onConfirm={() => deleteCircular(item.id)}
                    okText={t('cirPage.deleteOk')}
                    cancelText={t('common.cancel')}
                    okButtonProps={{ danger: true }}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              </Card>
            </List.Item>
          );
        }}
      />
      </Spin>

      {/* Create / Edit Modal */}
      <Modal
        title={
          <span style={{ color: '#001529', fontWeight: 700 }}>
            {editItem ? t('cirPage.editCircular') : t('cirPage.createCircular')}
          </span>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={680}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="title"
                label={t('cirPage.titleEn')}
                rules={[{ required: true, message: t('cirPage.titleRequired') }]}
              >
                <Input placeholder={t('cirPage.titleEnPlaceholder')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="titleAr"
                label={t('cirPage.titleAr')}
                rules={[{ required: true, message: t('cirPage.titleRequired') }]}
              >
                <Input placeholder={t('cirPage.titleArPlaceholder')} dir="rtl" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="content"
                label={t('cirPage.contentEn')}
                rules={[{ required: true, message: t('cirPage.contentRequired') }]}
              >
                <TextArea rows={5} placeholder={t('cirPage.contentEnPlaceholder')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="contentAr"
                label={t('cirPage.contentAr')}
                rules={[{ required: true, message: t('cirPage.contentRequired') }]}
              >
                <TextArea rows={5} placeholder={t('cirPage.contentArPlaceholder')} dir="rtl" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="type"
                label={t('cirPage.type')}
                rules={[{ required: true, message: t('cirPage.typeRequired') }]}
              >
                <Select placeholder={t('cirPage.typePlaceholder')}>
                  <Option value="POLICY_UPDATE">{t('circularTypes.policyUpdate')}</Option>
                  <Option value="FACILITY_BLACKLIST">{t('circularTypes.facilityBlacklist')}</Option>
                  <Option value="REMINDER">{t('circularTypes.reminder')}</Option>
                  <Option value="ANNOUNCEMENT">{t('circularTypes.announcement')}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="isActive"
                label={t('cirPage.activeLabel')}
                valuePropName="checked"
              >
                <Switch
                  checkedChildren={t('cirPage.activeStatus')}
                  unCheckedChildren={t('cirPage.inactiveStatus')}
                  defaultChecked
                />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button
              style={{ background: '#D4AF37', borderColor: '#D4AF37', color: '#fff', fontWeight: 600 }}
              onClick={handleSubmit}
            >
              {editItem ? t('cirPage.save') : t('cirPage.publish')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CircularsPage;
