import React from 'react';
import { Form, Button, Table } from 'react-bootstrap';
import Select from 'react-select';

import { FinanceMember } from '../types';

export type MemberAccessState = {
    id: string;
    can_view: boolean;
    can_use: boolean;
    can_manage: boolean;
};

type MemberAccessSelectorProps = {
    members: FinanceMember[];
    value: MemberAccessState[];
    onChange: (value: MemberAccessState[]) => void;
    ownerMemberId?: string | null;
    activeMemberId?: string | null;
    disabled?: boolean;
};

export const MemberAccessSelector: React.FC<MemberAccessSelectorProps> = ({
    members, value, onChange, ownerMemberId, activeMemberId, disabled = false
}) => {
    const selectedIds = value.map(v => String(v.id));

    const addableMembers = members.filter(member => {
        const idStr = String(member.id);
        return idStr !== ownerMemberId && !selectedIds.includes(idStr);
    });

    const addOptions = addableMembers.map(m => ({ value: String(m.id), label: m.full_name || `Unknown (${m.id})` }));

    const handleAdd = (option: any) => {
        if (!option) return;
        onChange([...value, { id: option.value, can_view: true, can_use: true, can_manage: false }]);
    };

    const handleRemove = (id: string) => {
        onChange(value.filter(v => String(v.id) !== id));
    };

    const handleToggle = (id: string, field: 'can_view' | 'can_use' | 'can_manage', checked: boolean) => {
        onChange(value.map(v => {
            if (String(v.id) === id) {
                const newVal = { ...v, [field]: checked };
                // Enforce hierarchy dependencies
                if (field === 'can_manage' && checked) {
                    newVal.can_use = true;
                    newVal.can_view = true;
                }
                if (field === 'can_use' && checked) {
                    newVal.can_view = true;
                }
                if (field === 'can_use' && !checked) {
                    newVal.can_manage = false;
                }
                if (field === 'can_view' && !checked) {
                    newVal.can_use = false;
                    newVal.can_manage = false;
                }
                return newVal;
            }
            return v;
        }));
    };

    return (
        <div className="member-access-selector">
            <div className="mb-3">
                <Select
                    options={addOptions}
                    placeholder="Tambah member ke dalam akses..."
                    value={null}
                    onChange={handleAdd}
                    classNamePrefix="react-select"
                    isDisabled={disabled || addOptions.length === 0}
                    noOptionsMessage={() => "Tidak ada member lain tersedia"}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                />
            </div>
            
            {value.length > 0 && (
                <div className="table-responsive border rounded" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    <Table size="sm" className="mb-0 text-center align-middle" hover>
                        <thead className="table-light sticky-top">
                            <tr>
                                <th className="text-start ps-3 fw-semibold text-muted py-2">Member</th>
                                <th className="fw-semibold text-muted py-2" style={{ width: '60px' }}>View</th>
                                <th className="fw-semibold text-muted py-2" style={{ width: '60px' }}>Use</th>
                                <th className="fw-semibold text-muted py-2" style={{ width: '80px' }}>Manage</th>
                                <th style={{ width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {value.map(item => {
                                const member = members.find(m => String(m.id) === String(item.id));
                                const name = member?.full_name || `Unknown (${item.id})`;
                                const isForcedManage = String(item.id) === ownerMemberId || String(item.id) === activeMemberId;

                                return (
                                    <tr key={item.id}>
                                        <td className="text-start ps-3 fw-semibold small py-2">{name}</td>
                                        <td>
                                            <Form.Check 
                                                type="switch" 
                                                checked={item.can_view} 
                                                onChange={(e) => handleToggle(String(item.id), 'can_view', e.target.checked)}
                                                disabled={disabled || isForcedManage}
                                                className="d-flex justify-content-center m-0"
                                            />
                                        </td>
                                        <td>
                                            <Form.Check 
                                                type="switch" 
                                                checked={item.can_use} 
                                                onChange={(e) => handleToggle(String(item.id), 'can_use', e.target.checked)}
                                                disabled={disabled || isForcedManage}
                                                className="d-flex justify-content-center m-0"
                                            />
                                        </td>
                                        <td>
                                            <Form.Check 
                                                type="switch" 
                                                checked={item.can_manage} 
                                                onChange={(e) => handleToggle(String(item.id), 'can_manage', e.target.checked)}
                                                disabled={disabled || isForcedManage}
                                                className="d-flex justify-content-center m-0"
                                            />
                                        </td>
                                        <td className="pe-2 text-end">
                                            <Button 
                                                variant="link" 
                                                className={`text-danger p-0 ${isForcedManage || disabled ? 'invisible' : ''}`}
                                                disabled={disabled || isForcedManage}
                                                onClick={() => handleRemove(String(item.id))}
                                                title="Hapus Hak Akses"
                                            >
                                                <i className="ri-close-circle-fill fs-5"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>
            )}
        </div>
    );
};
