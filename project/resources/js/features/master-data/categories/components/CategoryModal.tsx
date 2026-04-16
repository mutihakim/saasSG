import axios from "axios";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Select, { components, OptionProps, SingleValueProps } from "react-select";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";

interface CategoryModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: any;
  module: string;
  modules: string[];
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
  modules,
}: CategoryModalProps) => {
  const { t } = useTranslation();
  const tenantRoute = useTenantRoute();
  const isEdit = !!category;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    module: module,
    sub_type: "pengeluaran",
    parent_id: "" as string | number,
    icon: "ri-wallet-line",
    color: "primary",
    is_active: true,
    row_version: 0,
  });

  const [loading, setLoading] = useState(false);
  const [parentOptions, setParentOptions] = useState<Array<{ label: string; value: number }>>([]);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
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
        description: "",
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

  useEffect(() => {
    if (formData.module !== "finance" && formData.sub_type !== "") {
      setFormData((current) => ({ ...current, sub_type: "" }));
    }

    if (formData.module === "finance" && !formData.sub_type) {
      setFormData((current) => ({ ...current, sub_type: "pengeluaran" }));
    }
  }, [formData.module, formData.sub_type]);

  useEffect(() => {
    if (!show || !formData.module) {
      setParentOptions([]);
      return;
    }

    let isCancelled = false;

    const loadParents = async () => {
      try {
        const response = await axios.get(tenantRoute.apiTo("/master/categories"), {
          params: {
            module: formData.module,
            roots_only: 1,
            exclude_children: 1,
            per_page: "all",
          },
        });

        const items = Array.isArray(response.data?.data?.categories) ? response.data.data.categories : [];
        const nextOptions = items
          .filter((parent: any) => !category || parent.id !== category.id)
          .map((parent: any) => ({
            label: parent.name,
            value: parent.id,
          }));

        if (!isCancelled) {
          setParentOptions(nextOptions);
        }
      } catch {
        if (!isCancelled) {
          setParentOptions([]);
        }
      }
    };

    void loadParents();

    return () => {
      isCancelled = true;
    };
  }, [category, formData.module, show, tenantRoute]);

  useEffect(() => {
    if (!formData.parent_id) {
      return;
    }

    const hasSelectedParent = parentOptions.some((option) => String(option.value) === String(formData.parent_id));

    if (!hasSelectedParent) {
      setFormData((current) => ({ ...current, parent_id: "" }));
    }
  }, [formData.parent_id, parentOptions]);

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
        sub_type: formData.module === "finance" ? formData.sub_type || "pengeluaran" : null,
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

  return (
    <Modal show={show} onHide={onClose} centered size="lg" contentClassName="category-modal" data-testid="category-modal">
      <Modal.Header closeButton className="bg-light p-3">
        <Modal.Title>{isEdit ? t("master.categories.modals.edit_title") : t("master.categories.modals.add_title")}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col lg={12}>
              <Form.Group className="mb-3">
                <Form.Label htmlFor="category-name">{t("master.categories.fields.name")}</Form.Label>
                <Form.Control
                  id="category-name"
                  type="text"
                  placeholder={t("master.common.search_placeholder")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="category-name-input"
                />
              </Form.Group>
            </Col>

            <Col lg={12}>
              <Form.Group className="mb-3">
                <Form.Label htmlFor="category-description">{t("master.categories.fields.description")}</Form.Label>
                <Form.Control
                  id="category-description"
                  as="textarea"
                  rows={3}
                  placeholder={t("master.categories.placeholders.description")}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Form.Group>
            </Col>
            
            <Col lg={6}>
              <Form.Group className="mb-3">
                <Form.Label htmlFor="category-module">{t("master.categories.fields.module")}</Form.Label>
                {isEdit ? (
                  <Form.Control
                    id="category-module"
                    type="text"
                    value={formData.module ? t(`master.categories.modules.${formData.module}`) : ""}
                    disabled
                  />
                ) : (
                  <Form.Select
                    id="category-module"
                    value={formData.module}
                    onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                    data-testid="category-module-select"
                  >
                    <option value="">{t("master.categories.placeholders.select_module")}</option>
                    {modules.map((moduleOption) => (
                      <option key={moduleOption} value={moduleOption}>
                        {t(`master.categories.modules.${moduleOption}`)}
                      </option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>
            </Col>

            {formData.module === 'finance' && (
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="category-sub-type">{t("master.categories.fields.type")}</Form.Label>
                  <Form.Select
                    id="category-sub-type"
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
                <Form.Label htmlFor="category-parent">{t("master.categories.fields.parent")}</Form.Label>
                <Select
                  inputId="category-parent"
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
              <Form.Group className="mb-3" controlId="category-icon">
                <Form.Label>{t("master.categories.fields.icon")}</Form.Label>
                <Select
                    inputId="category-icon"
                    options={ICON_OPTIONS}
                    components={{ Option: IconOption, SingleValue: IconSingleValue }}
                    value={ICON_OPTIONS.find(o => o.value === formData.icon) || null}
                    onChange={(opt: any) => setFormData({ ...formData, icon: opt ? opt.value : "ri-wallet-line" })}
                    classNamePrefix="react-select"
                />
              </Form.Group>
            </Col>

            <Col lg={6}>
              <Form.Group className="mb-3" controlId="category-color">
                <Form.Label>{t("master.categories.fields.color")}</Form.Label>
                <Select
                    inputId="category-color"
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
          <Button variant="primary" type="submit" disabled={loading} data-testid="category-submit-btn">
            {loading ? t("master.categories.buttons.saving") : (isEdit ? t("master.categories.buttons.update") : t("master.categories.buttons.save"))}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CategoryModal;
