import axios from "axios";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Select, { components, OptionProps, SingleValueProps } from "react-select";

import { parseApiError } from "../../../../../common/apiError";
import { notify } from "../../../../../common/notify";
import { useTenantRoute } from "../../../../../common/tenantRoute";

interface CategoryModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: any;
  module: string;
  parents: any[];
}

const ICON_OPTIONS = [
    { label: "Default (Tag)", value: "ri-price-tag-3-line" },
    { label: "Wallet", value: "ri-wallet-line" },
    { label: "Bank Card", value: "ri-bank-card-line" },
    { label: "Money Dollar", value: "ri-money-dollar-circle-line" },
    { label: "Money Euro", value: "ri-money-euro-circle-line" },
    { label: "Shopping Bag", value: "ri-shopping-bag-line" },
    { label: "Shopping Cart", value: "ri-shopping-cart-line" },
    { label: "Restaurant", value: "ri-restaurant-line" },
    { label: "Cup", value: "ri-cup-line" },
    { label: "Home", value: "ri-home-4-line" },
    { label: "Car", value: "ri-car-line" },
    { label: "Truck", value: "ri-truck-line" },
    { label: "Plane", value: "ri-plane-line" },
    { label: "Medal", value: "ri-medal-line" },
    { label: "Heart Pulse", value: "ri-heart-pulse-line" },
    { label: "Medicine", value: "ri-capsule-line" },
    { label: "Book", value: "ri-book-line" },
    { label: "Gamepad", value: "ri-gamepad-line" },
    { label: "Gift", value: "ri-gift-line" },
    { label: "Tools", value: "ri-tools-line" },
    { label: "Lightbulb", value: "ri-lightbulb-line" },
    { label: "Seedling", value: "ri-seedling-line" },
    { label: "Cloud", value: "ri-cloud-line" },
    { label: "Flash", value: "ri-flashlight-line" },
    { label: "Umbrella", value: "ri-umbrella-line" },
];

const COLOR_OPTIONS = [
    { label: "Primary (Blue)", value: "primary" },
    { label: "Secondary (Grey)", value: "secondary" },
    { label: "Success (Green)", value: "success" },
    { label: "Danger (Red)", value: "danger" },
    { label: "Warning (Yellow)", value: "warning" },
    { label: "Info (Cyan)", value: "info" },
    { label: "Dark (Black)", value: "dark" },
];

// Custom components for Icon Select
const IconOption = (props: OptionProps<any>) => (
    <components.Option {...props}>
        <div className="d-flex align-items-center">
            <i className={`${props.data.value} me-2 fs-18`}></i>
            {props.data.label}
        </div>
    </components.Option>
);

const IconSingleValue = (props: SingleValueProps<any>) => (
    <components.SingleValue {...props}>
        <div className="d-flex align-items-center">
            <i className={`${props.data.value} me-2 fs-18 text-primary`}></i>
            {props.data.label}
        </div>
    </components.SingleValue>
);

// Custom components for Color Select
const ColorOption = (props: OptionProps<any>) => (
    <components.Option {...props}>
        <div className="d-flex align-items-center">
            <span className={`badge bg-${props.data.value} me-2`} style={{ width: '20px', height: '20px', display: 'inline-block' }}>&nbsp;</span>
            {props.data.label}
        </div>
    </components.Option>
);

const ColorSingleValue = (props: SingleValueProps<any>) => (
    <components.SingleValue {...props}>
        <div className="d-flex align-items-center">
            <span className={`badge bg-${props.data.value} me-2`} style={{ width: '16px', height: '16px', display: 'inline-block' }}>&nbsp;</span>
            {props.data.label}
        </div>
    </components.SingleValue>
);

const CategoryModal = ({
  show,
  onClose,
  onSuccess,
  category,
  module,
  parents
}: CategoryModalProps) => {
  const { t } = useTranslation();
  const tenantRoute = useTenantRoute();
  const isEdit = !!category;

  const [formData, setFormData] = useState({
    name: "",
    module: module,
    sub_type: "pengeluaran",
    parent_id: "" as string | number,
    icon: "ri-wallet-line",
    color: "primary",
    is_active: true,
    row_version: 0,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        module: category.module || module,
        sub_type: category.sub_type || "pengeluaran",
        parent_id: category.parent_id || "",
        icon: category.icon || "ri-wallet-line",
        color: category.color || "primary",
        is_active: category.is_active ?? true,
        row_version: category.row_version || 0,
      });
    } else {
      setFormData({
        name: "",
        module,
        sub_type: module === 'finance' ? 'pengeluaran' : '',
        parent_id: "",
        icon: "ri-wallet-line",
        color: "primary",
        is_active: true,
        row_version: 0,
      });
    }
  }, [category, show, module]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEdit 
        ? tenantRoute.apiTo(`/master/categories/${category.id}`)
        : tenantRoute.apiTo("/master/categories");
      
      const method = isEdit ? "patch" : "post";
      
      await axios[method](url, {
        ...formData,
        parent_id: formData.parent_id || null,
      });

      notify.success(t(isEdit ? "master.categories.messages.success_update" : "master.categories.messages.success_add"));
      onSuccess();
      onClose();
    } catch (err: any) {
      const parsed = parseApiError(err, isEdit ? "Failed to update category" : "Failed to create category");
      notify.error({
        title: parsed.title,
        detail: parsed.detail
      });
    } finally {
      setLoading(false);
    }
  };

  const parentOptions = parents
    .filter(p => !p.parent_id && (!category || p.id !== category.id)) 
    .map(p => ({ 
        label: p.name, 
        value: p.id 
    }));

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton className="bg-light p-3">
        <Modal.Title>{isEdit ? t("master.categories.modals.edit_title") : t("master.categories.modals.add_title")}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col lg={12}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.categories.fields.name")}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={t("master.common.search_placeholder")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
            
            <Col lg={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.categories.fields.module")}</Form.Label>
                {isEdit ? (
                  <Form.Control
                    type="text"
                    value={formData.module ? t(`master.categories.modules.${formData.module}`) : ""}
                    disabled
                  />
                ) : (
                  <Form.Select
                    value={formData.module}
                    onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                  >
                    <option value="">{t("master.categories.placeholders.select_module")}</option>
                    <option value="finance">{t("master.categories.modules.finance")}</option>
                    <option value="grocery">{t("master.categories.modules.grocery")}</option>
                    <option value="inventory">{t("master.categories.modules.inventory")}</option>
                    <option value="task">{t("master.categories.modules.task")}</option>
                    <option value="medical">{t("master.categories.modules.medical")}</option>
                    <option value="wishlist">{t("master.categories.modules.wishlist")}</option>
                  </Form.Select>
                )}
              </Form.Group>
            </Col>

            {module === 'finance' && (
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("master.categories.fields.type")}</Form.Label>
                  <Form.Select
                    value={formData.sub_type}
                    onChange={(e) => setFormData({ ...formData, sub_type: e.target.value })}
                  >
                    <option value="pemasukan">{t("master.categories.types.income")}</option>
                    <option value="pengeluaran">{t("master.categories.types.expense")}</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            )}

            <Col lg={12}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.categories.fields.parent")}</Form.Label>
                <Select
                  options={parentOptions}
                  value={parentOptions.find(o => String(o.value) === String(formData.parent_id)) || null}
                  onChange={(opt: any) => setFormData({ ...formData, parent_id: opt ? opt.value : "" })}
                  isClearable
                  placeholder={t("master.categories.placeholders.parent")}
                  classNamePrefix="react-select"
                />
                <Form.Text className="text-muted">{t("master.categories.help.parent_max_level")}</Form.Text>
              </Form.Group>
            </Col>

            <Col lg={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.categories.fields.icon")}</Form.Label>
                <Select
                    options={ICON_OPTIONS}
                    components={{ Option: IconOption, SingleValue: IconSingleValue }}
                    value={ICON_OPTIONS.find(o => o.value === formData.icon) || null}
                    onChange={(opt: any) => setFormData({ ...formData, icon: opt ? opt.value : "ri-wallet-line" })}
                    classNamePrefix="react-select"
                />
              </Form.Group>
            </Col>

            <Col lg={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.categories.fields.color")}</Form.Label>
                <Select
                    options={COLOR_OPTIONS}
                    components={{ Option: ColorOption, SingleValue: ColorSingleValue }}
                    value={COLOR_OPTIONS.find(o => o.value === formData.color) || null}
                    onChange={(opt: any) => setFormData({ ...formData, color: opt ? opt.value : "primary" })}
                    classNamePrefix="react-select"
                />
              </Form.Group>
            </Col>

            <Col lg={6}>
                <Form.Group className="mb-3">
                    <Form.Check 
                        type="switch"
                        id="category-active-switch"
                        label={t("master.common.status.active")}
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose} disabled={loading}>{t("master.categories.buttons.cancel")}</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? t("master.categories.buttons.saving") : (isEdit ? t("master.categories.buttons.update") : t("master.categories.buttons.save"))}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CategoryModal;
