"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { Users,Briefcase,Shield,Database,Search,Plus,ChevronRight,CheckCircle,XCircle,Clock,FileText,Award,History,Settings,ArrowLeft,ExternalLink,Mail,Calendar,Globe,Terminal,Code,Cpu,Zap,Linkedin,Github,Trophy,ArrowUpCircle,Download,Trash,MoreVertical} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { headers } from "../../../next.config";

function AdminDashboardContent() {
    const sixMonthsFromNow = () => {
        const d = new Date();
        d.setMonth(d.getMonth() + 6);
        d.setHours(0,0,0,0);
        return d.getTime();
    };

    const [activeTab, setActiveTab] = useState("applications");
    const [activeSubTab, setActiveSubTab] = useState("PENDING");
    // Org sub-tab (ACTIVE / ARCHIVED)
    const [orgSubTab, setOrgSubTab] = useState('ACTIVE');
    const [apps, setApps] = useState([]);
    const [fellows, setFellows] = useState([]);
    const [orgs, setOrgs] = useState([]);

    // map org code to display name for badge rendering
    const getOrgName = (code) => {
        const o = (orgs || []).find(x => x.code === code);
        return o ? o.name : "";
    };
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [orgInspectorMember, setOrgInspectorMember] = useState(null); // nested member view inside org inspector
    const [actionLoading, setActionLoading] = useState(false);
    const [isEditingOrg, setIsEditingOrg] = useState(false);
    const [orgData, setOrgData] = useState({ name: '', code: '', emailDomainWhitelist: [], endDate: sixMonthsFromNow(), defaultTenureEndDate: null, formVar1: [], availableRoles: [], isActive: true, adminPassword: ''});
    const [tenureEndDate, setTenureEndDate] = useState("");
    const [availableRoles, setAvailableRoles] = useState([]);
    const [newRole, setNewRole] = useState("");
    const [newRoleDescription, setNewRoleDescription] = useState("");
    const [newOrgRole, setNewOrgRole] = useState("");
    const [newOrgRoleDescription, setNewOrgRoleDescription] = useState("");
    const [editingRoleDesc, setEditingRoleDesc] = useState(null);
    const [editingRoleTempDesc, setEditingRoleTempDesc] = useState("");
    const [projectData, setProjectData] = useState([]);

    // Role menu + delete confirm state
    const [roleMenuOpenFor, setRoleMenuOpenFor] = useState(null); // role name
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { mode: 'GLOBAL'|'LOCAL', roleName, roleObj }

    // Promotion State
    const [promotionData, setPromotionData] = useState({ newRole: "", newStatus: "ACTIVE", newCohort: "", completionStatus: "PROMOTED" });
    const [showPromoteModal, setShowPromoteModal] = useState(false);

    // Interview Schedule State
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleData, setScheduleData] = useState({ scheduledAt: "", meetLink: "" });
    // Assign role modal for skipping protocol
    const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
    const [skipModalTarget, setSkipModalTarget] = useState(null);
    const [skipAssignedRole, setSkipAssignedRole] = useState("");

    // Termination State
    const [showTerminateModal, setShowTerminateModal] = useState(false);
    const [terminationData, setTerminationData] = useState({ reason: "End of Tenure", endDate: "" });

    // Manual Fellow State
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualFellowData, setManualFellowData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: '',
        orgCode: '',
        cohort: 'C1',
        startDate: new Date().toISOString().split('T')[0]
    });

    // Create Project State
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
    const [newProjectData, setNewProjectData] = useState({
        title: '',
        description: '',
        supportedLinks: [],
        contributors: [],
        isActive: true
    });
    const [newLink, setNewLink] = useState({ linkName: '', url: '' });
    const [newContributor, setNewContributor] = useState({ globalPid: '', firstName: '' });

    const router = useRouter();

    // Scroll refs + persistence (sessionStorage)
    const listRef = useRef(null);
    const inspectorRef = useRef(null);

    const listScrollKey = () => `admin:scroll:list:${activeTab}:${activeSubTab || ''}`;
    const inspectorScrollKey = () => {
        if (activeTab === 'orgs' && selectedItem) {
            const orgKey = selectedItem.code || selectedItem._id || 'unknown';
            const memberPart = orgInspectorMember ? `:member:${orgInspectorMember._id || orgInspectorMember.email}` : ':org';
            return `admin:scroll:inspector:org:${orgKey}${memberPart}`;
        }
        if (activeTab === 'applications' && selectedItem) return `admin:scroll:inspector:app:${selectedItem._id}`;
        if (activeTab === 'fellows' && selectedItem) return `admin:scroll:inspector:fellow:${selectedItem._id}`;
        if (activeTab === 'projects' && selectedItem) return `admin:scroll:inspector:project:${selectedItem._id}`;
        return `admin:scroll:inspector:${activeTab}`;
    };

    useEffect(() => {
        // restore left-list scroll on tab/subtab/load changes
        try {
            const pos = sessionStorage.getItem(listScrollKey());
            if (pos && listRef.current) listRef.current.scrollTop = parseInt(pos, 10);
        } catch (e) {/* ignore */}
    }, [activeTab, activeSubTab, loading]);

    useEffect(() => {
        // restore inspector scroll when selected item / nested member changes or after reload
        try {
            const pos = sessionStorage.getItem(inspectorScrollKey());
            if (pos && inspectorRef.current) inspectorRef.current.scrollTop = parseInt(pos, 10);
        } catch (e) {/* ignore */}
    }, [selectedItem, orgInspectorMember, activeTab, loading]);

    const saveListScroll = () => { if (!listRef.current) return; sessionStorage.setItem(listScrollKey(), String(listRef.current.scrollTop)); };
    const saveInspectorScroll = () => { if (!inspectorRef.current) return; sessionStorage.setItem(inspectorScrollKey(), String(inspectorRef.current.scrollTop)); };

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) { 
                setLoading(false);
                return;
            }
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            const [appsRes, fellowsRes, orgsRes, rolesRes] = await Promise.all([
                axios.get(`${serverUrl}/application/admin/list`, config),
                axios.get(`${serverUrl}/admin/fellows`, config),
                axios.get(`${serverUrl}/application/admin/orgs`, config),
                axios.get(`${serverUrl}/application/admin/roles`, config)
            ]);
            setApps(appsRes.data);
            setFellows(fellowsRes.data);
            setOrgs(orgsRes.data);
            setAvailableRoles(rolesRes.data);
            // return fetched data so callers can synchronously act on fresh values
            return { apps: appsRes.data, fellows: fellowsRes.data, orgs: orgsRes.data, roles: rolesRes.data };
        } catch (error) {
            if (error.response?.status === 401) { 
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                router.push("/admin"); 
            }
            toast.error("Failed to load dashboard data");
            return null;
        } finally { setLoading(false); }
    };

    const fetchProjects = async () =>{
        setLoading(true);
        try{
            const token = localStorage.getItem("accessToken");
            if(!token){
                setLoading(false);
                return;
            }
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            const projects = await axios.get(`${serverUrl}/projects`, config);
            setProjectData(projects.data);

            return projects.data;
        }catch(error){
            if(error.response?.status === 401){
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                router.push("/admin");
            }
            toast.error("Failed to load the Projects");
        } finally { setLoading(false); }
    };

    const handleTerminateFellow = async () => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            const target = orgInspectorMember || selectedItem;
            if (!target || !target._id) { toast.error('No fellow selected'); setActionLoading(false); return; }

            await axios.post(`${serverUrl}/admin/fellows/${target._id}/terminate`,
                terminationData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Fellow Terminated and Email Sent");
            setShowTerminateModal(false);

            const fresh = await fetchData();
            const updated = (fresh?.fellows || []).find(f => f._id === target._id) || { ...target, status: 'TERMINATED' };
            if (target === orgInspectorMember) setOrgInspectorMember(updated); else setSelectedItem(updated);
        } catch (error) {
            toast.error("Failed to terminate fellow");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddManualFellow = async () => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            await axios.post(`${serverUrl}/admin/fellows/add`, manualFellowData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Fellow Added Successfully");
            setShowManualModal(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add fellow");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectData.title || !newProjectData.description) {
            toast.error("Title and Description are required");
            return;
        }
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            await axios.post(`${serverUrl}/project`, newProjectData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Project Created Successfully");
            setShowCreateProjectModal(false);
            setNewProjectData({
                title: '',
                description: '',
                supportedLinks: [],
                contributors: [],
                isActive: true
            });
            fetchProjects();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create project");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddLink = () => {
        if (!newLink.linkName || !newLink.url) {
            toast.error("Link name and URL are required");
            return;
        }
        setNewProjectData({
            ...newProjectData,
            supportedLinks: [...newProjectData.supportedLinks, { ...newLink }]
        });
        setNewLink({ linkName: '', url: '' });
    };


    const handleQuickAddOrg = async (name, code) => {
        if (!name || !code) return toast.error("Name and Code required");
        try {
            const token = localStorage.getItem("accessToken");
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            await axios.post(`${serverUrl}/application/admin/orgs`,
                { name, code, isActive: false, emailDomainWhitelist: [], defaultTenureEndDate: 0, formVar1: [], availableRoles: [], adminPassword},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Node "${code}" initialized (Offline)`);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add node");
        }
    };

    const handleAddRole = async () => {
        if (!newRole.trim()) return;
        try {
            const token = localStorage.getItem("accessToken");
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            await axios.post(`${serverUrl}/application/admin/roles`,
                { name: newRole, description: newRoleDescription },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Role "${newRole}" added!`);
            setNewRole("");
            setNewRoleDescription("");
            fetchData(); // Refresh roles
        } catch (error) {
            console.error("Add Role Error:", error);
            const errMsg = error.response?.data?.message || error.response?.data?.msg || "Failed to add role";
            const status = error.response?.status;
            toast.error(status === 401 ? "Session expired. Please login again." : errMsg);
            if (status === 401) router.push("/admin");
        }
    };

    // Delete a global role (deactivate in RolesMaster) — shows undo toast
    const handleDeleteRole = async (roleObj, skipConfirm = false) => {
        // Accept either: role object { id|_id, name }, a partial object { name }, or plain string role name
        let role = roleObj;

        // If caller passed a string (role name), try to resolve the full role object from availableRoles
        if (typeof role === 'string') {
            const found = (availableRoles || []).find(ar => (typeof ar === 'string' ? ar : ar.name) === role);
            if (found) role = found;
        }

        // If caller passed a partial object without id, try to resolve by name
        if (role && !(role.id || role._id) && role.name) {
            const found = (availableRoles || []).find(ar => (typeof ar === 'string' ? ar : ar.name) === role.name);
            if (found) role = found;
        }

        // Defensive fallback: query the server for the role list and resolve by name (covers cases where
        if (role && !(role.id || role._id) && role.name) {
            try {
                const token = localStorage.getItem('accessToken');
                const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
                const res = await axios.get(`${serverUrl}/application/admin/roles`, { headers: { Authorization: `Bearer ${token}` } });
                const srvFound = (res.data || []).find(r => r.name === role.name);
                if (srvFound && (srvFound.id || srvFound._id)) role = srvFound;
            } catch (e) {
                // ignore — we'll show the generic "Unable to determine role id" below
                console.debug('Role id lookup fallback failed', e?.message || e);
            }
        }

        if (!role || !(role.id || role._id)) return toast.error('Unable to determine role id');
        if (!skipConfirm && !window.confirm(`Deactivate global role "${role.name}"? This will hide it from selects and org lists.`)) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            const id = role.id || role._id;
            await axios.delete(`${serverUrl}/application/admin/roles/${id}`, { headers: { Authorization: `Bearer ${token}` } });

            // Refresh immediately so UI reflects deactivation
            fetchData();

            // Show undo toast (calls restore endpoint)
            let toastId;
            toastId = toast.info(
                <div className="flex items:center justify-between gap-4">
                    <span>Role "{role.name}" deactivated</span>
                    <button
                        className="text-[10px] px-2 py-1 bg-white/5 rounded text-cyan-300 hover:bg-white/10"
                        onClick={async () => {
                            toast.dismiss(toastId);
                            await handleRestoreRole(role);
                        }}
                    >
                        UNDO
                    </button>
                </div>,
                { autoClose: 8000 }
            );
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to deactivate role');
        } finally {
            setActionLoading(false);
        }
    };

    // Permanently delete a global role — safe cleanup of org availableRoles/formVar1 and applicant.preferredRoles
    const handlePermanentDeleteRole = async (roleObj) => {
        let role = roleObj;

        if (typeof role === 'string') {
            const found = (availableRoles || []).find(ar => (typeof ar === 'string' ? ar : ar.name) === role);
            if (found) role = found;
        }

        if (role && !(role.id || role._id) && role.name) {
            try {
                const token = localStorage.getItem('accessToken');
                const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
                const res = await axios.get(`${serverUrl}/application/admin/roles`, { headers: { Authorization: `Bearer ${token}` } });
                const srvFound = (res.data || []).find(r => r.name === role.name);
                if (srvFound && (srvFound.id || srvFound._id)) role = srvFound;
            } catch (e) {
                console.debug('Role id lookup fallback failed', e?.message || e);
            }
        }

        if (!role || !(role.id || role._id)) return toast.error('Unable to determine role id');
        if (!window.confirm(`Permanently delete role "${role.name}" and remove it from organizations & applicant preferred roles? This is irreversible.`)) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            const id = role.id || role._id;

            await axios.delete(`${serverUrl}/application/admin/roles/${id}/permanent?force=true`, { headers: { Authorization: `Bearer ${token}` } });

            toast.success(`Role "${role.name}" permanently deleted`);
            setDeleteConfirm(null);
            fetchData();
        } catch (err) {
            const counts = err.response?.data?.counts;
            if (counts) {
                const details = Object.entries(counts).map(([k,v]) => `${k}: ${v}`).join(', ');
                toast.error((err.response?.data?.message || 'Deletion blocked') + ' — ' + details);
            } else {
                toast.error(err.response?.data?.message || 'Failed to permanently delete role');
            }
        } finally {
            setActionLoading(false);
        }
    };

    // Add role locally to the currently-editing organization (name + optional description)
    const handleAddOrgRole = () => {
        const name = (newOrgRole || '').trim();
        if (!name) return toast.error('Role name required');

        const roleObj = { name, description: (newOrgRoleDescription || '').trim() };
        const currentAvail = Array.isArray(orgData.availableRoles) ? [...orgData.availableRoles] : [];

        // Prevent duplicates by name (case-sensitive match on UI)
        if (currentAvail.find(r => r.name === roleObj.name)) {
            setNewOrgRole('');
            setNewOrgRoleDescription('');
            return toast.info('Role already present for this org');
        }

        currentAvail.push(roleObj);
        const currentFormVar1 = Array.isArray(orgData.formVar1) ? [...orgData.formVar1] : [];
        if (!currentFormVar1.includes(roleObj.name)) currentFormVar1.push(roleObj.name);

        setOrgData({ ...orgData, availableRoles: currentAvail, formVar1: currentFormVar1 });
        setNewOrgRole('');
        setNewOrgRoleDescription('');
        toast.success(`Added "${roleObj.name}" to organization (local)`);
    };

    // Remove a role from the current organization immediately (persist via API when org exists)
    const handleDeleteOrgRole = async (roleName, skipConfirm = false) => {
        if (!roleName) return toast.error('Role name required');
        if (!skipConfirm && !window.confirm(`Remove role "${roleName}" from organization ${orgData.code || ''}?`)) return;

        // Backup (for undo)
        const backupRole = (orgData.availableRoles || []).find(r => r.name === roleName) || { name: roleName, description: '' };

        // Update local state immediately for fast UI response
        const updatedAvail = (orgData.availableRoles || []).filter(r => r.name !== roleName);
        const updatedFormVar1 = (orgData.formVar1 || []).filter(n => n !== roleName);
        setOrgData({ ...orgData, availableRoles: updatedAvail, formVar1: updatedFormVar1 });

        // If org is not persisted yet, just show toast and return
        if (!orgData?.id) {
            toast.success(`Removed "${roleName}" (local) — click Save to persist`);
            return;
        }

        setActionLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';

            // Prepare payload similar to handleSaveOrg
            const payload = {
                id: orgData.id,
                name: orgData.name,
                code: orgData.code,
                emailDomainWhitelist: orgData.emailDomainWhitelist || [],
                endDate: orgData.endDate || 0,
                formVar1: updatedFormVar1,
                availableRoles: updatedAvail,
                isActive: orgData.isActive
            };

            await axios.post(`${serverUrl}/application/admin/orgs`, payload, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();

            // undo option
            let toastId = null;
            toastId = toast.info(
                <div className="flex items-center justify-between gap-4">
                    <span>Removed "{roleName}" from {orgData.code}</span>
                    <button
                        className="text-[10px] px-2 py-1 bg-white/5 rounded text-cyan-300 hover:bg-white/10"
                        onClick={async () => {
                            toast.dismiss(toastId);
                            await handleRestoreOrgRole(backupRole);
                        }}
                    >
                        UNDO
                    </button>
                </div>,
                { autoClose: 8000 }
            );

            toast.success(`Role "${roleName}" removed from org`);
        } catch (err) {
            console.error('Remove org role failed', err);
            toast.error(err.response?.data?.message || 'Failed to remove role from org');
            // revert local change on failure
            setOrgData({ ...orgData, availableRoles: (orgData.availableRoles || []).concat([backupRole]), formVar1: (orgData.formVar1 || []).concat([roleName]) });
        } finally {
            setActionLoading(false);
        }
    };

    // Restore a role that was removed from the org
    const handleRestoreOrgRole = async (roleObj) => {
        if (!roleObj || !roleObj.name) return toast.error('Invalid role');

        // If org not persisted yet just add locally
        if (!orgData?.id) {
            const updated = Array.isArray(orgData.availableRoles) ? [...orgData.availableRoles, { name: roleObj.name, description: roleObj.description || '' }] : [{ name: roleObj.name, description: roleObj.description || '' }];
            setOrgData({ ...orgData, availableRoles: updated, formVar1: Array.from(new Set([...(orgData.formVar1 || []), roleObj.name])) });
            toast.success(`Restored "${roleObj.name}" (local)`);
            return;
        }

        setActionLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            const updatedAvail = Array.from(new Set([...(orgData.availableRoles || []).map(r => r.name), roleObj.name]));
            const payload = {
                id: orgData.id,
                name: orgData.name,
                code: orgData.code,
                emailDomainWhitelist: orgData.emailDomainWhitelist || [],
                endDate: orgData.endDate || 0,
                formVar1: updatedAvail,
                availableRoles: (orgData.availableRoles || []).concat([{ name: roleObj.name, description: roleObj.description || '' }]),
                isActive: orgData.isActive
            };
            await axios.post(`${serverUrl}/application/admin/orgs`, payload, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`Role "${roleObj.name}" restored to org`);
            fetchData();
        } catch (err) {
            console.error('Restore org role failed', err);
            toast.error(err.response?.data?.message || 'Failed to restore role to org');
        } finally {
            setActionLoading(false);
        }
    };

    // Restore a previously deactivated global role
    const handleRestoreRole = async (roleObj) => {
        if (!roleObj || !(roleObj.id || roleObj._id)) return toast.error('Unable to determine role id');
        setActionLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            const id = roleObj.id || roleObj._id;
            await axios.post(`${serverUrl}/application/admin/roles/${id}/restore`, null, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`Role "${roleObj.name}" restored`);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to restore role');
        } finally {
            setActionLoading(false);
        }
    };

    // --- Role description editing (inline, local only until org saved) ---
    const startEditRoleDesc = (roleName) => {
        const existing = (orgData.availableRoles || []).find(r => r.name === roleName) || { description: '' };
        setEditingRoleDesc(roleName);
        setEditingRoleTempDesc(existing.description || '');
    };

    const saveRoleDescEdit = async () => {
        const prevRole = (orgData.availableRoles || []).find(r => r.name === editingRoleDesc) || { name: editingRoleDesc, description: '' };
        const updatedAvail = (orgData.availableRoles || []).map(r => r.name === editingRoleDesc ? { ...r, description: editingRoleTempDesc } : r);

        // Optimistic UI update
        setOrgData({ ...orgData, availableRoles: updatedAvail });
        setEditingRoleDesc(null);
        setEditingRoleTempDesc('');
        toast.success('Role description updated (local)');

        // If org is not persisted yet, user will still need to click Save — nothing to persist server-side
        if (!orgData?.id) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';

            const payload = {
                id: orgData.id,
                name: orgData.name,
                code: orgData.code,
                emailDomainWhitelist: orgData.emailDomainWhitelist || [],
                endDate: orgData.endDate || 0,
                formVar1: orgData.formVar1 || [],
                availableRoles: updatedAvail,
                isActive: orgData.isActive
            };

            await axios.post(`${serverUrl}/application/admin/orgs`, payload, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Role description saved to node');
            await fetchData();
        } catch (err) {
            console.error('Save role description failed', err);
            toast.error(err.response?.data?.message || 'Failed to save role description');
            // revert local change on failure
            const reverted = (orgData.availableRoles || []).map(r => r.name === prevRole.name ? prevRole : r);
            setOrgData({ ...orgData, availableRoles: reverted });
        } finally {
            setActionLoading(false);
        }
    };

    const cancelRoleDescEdit = () => {
        setEditingRoleDesc(null);
        setEditingRoleTempDesc('');
    };

    // Check authentication before loading data
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        const user = JSON.parse(localStorage.getItem("user") || "null");
        
        if (!token || !user || !user.isAdmin) {
            router.push("/admin");
            return;
        }
        
        fetchData();
        fetchProjects();
    }, []);

    const handleUpdateAppStatus = async (status) => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const target = orgInspectorMember || selectedItem;
            if (!target || !target._id) { toast.error('No applicant selected'); setActionLoading(false); return; }

            // If accepting, ensure assignedRole is present
            if (status === 'ACCEPTED' && !(target.assignedRole || '').trim()) {
                toast.error('Assigned role is required before accepting');
                setActionLoading(false);
                return;
            }

            await axios.patch(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/application/admin/status`, {
                applicantId: target._id,
                status,
                tenureEndDate: status === 'ACCEPTED' ? tenureEndDate : undefined,
                assignedRole: status === 'ACCEPTED' ? (target.assignedRole || '').trim() : undefined
            }, { headers: { Authorization: `Bearer ${token}` } });

            toast.success(`Applicant ${status}`);

            // refresh and re-select the same item so inspector remains visible
            const fresh = await fetchData();
            const updated = (fresh?.apps || []).find(a => a._id === target._id) || { ...target, status };
            if (target === orgInspectorMember) setOrgInspectorMember(updated); else setSelectedItem(updated);
        } catch (error) { toast.error("Failed to update status"); } finally { setActionLoading(false); }
    };

    const handlePromoteFellow = async () => {
        if (!promotionData.newRole) { toast.error("Role is required"); return; }
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const target = orgInspectorMember || selectedItem;
            if (!target || !target._id) { toast.error('No fellow selected'); setActionLoading(false); return; }

            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/admin/fellows/${target._id}/promote`, promotionData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Fellow Promoted!");
            setShowPromoteModal(false);

            const fresh = await fetchData();
            const updated = (fresh?.fellows || []).find(f => f._id === target._id) || { ...target };
            if (target === orgInspectorMember) setOrgInspectorMember(updated); else setSelectedItem(updated);
        } catch (error) { toast.error("Promotion failed"); } finally { setActionLoading(false); }
    };

    const handleScheduleInterview = async () => {
        if (!scheduleData.scheduledAt || !scheduleData.meetLink) {
            toast.error("Please provide both time and link");
            return;
        }
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");

            // Parse the local datetime string (no timezone conversion)
            const localDate = new Date(scheduleData.scheduledAt);
            const pad = n => n.toString().padStart(2, '0');
            const istIsoString = `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}T${pad(localDate.getHours())}:${pad(localDate.getMinutes())}:00+05:30`;

            // Target can be the nested orgInspectorMember (when opened inside org inspector) or the selectedItem (applications view)
            const target = (orgInspectorMember && (orgInspectorMember.status || orgInspectorMember.interviewDetails)) ? orgInspectorMember : selectedItem;
            if (!target || !target._id) { toast.error("No applicant selected"); setActionLoading(false); return; }

            await axios.put(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/application/admin/schedule-interview`, {
                applicantId: target._id,
                scheduledAt: istIsoString,
                meetLink: scheduleData.meetLink
            }, { headers: { Authorization: `Bearer ${token}` } });

            toast.success("Interview Scheduled & Email Sent!");
            setShowScheduleModal(false);

            // Refresh backend data then restore local selection so UI stays in the same context
            const fresh = await fetchData();
            const updatedApp = (fresh?.apps || []).find(a => a._id === target._id) || { ...target, interviewDetails: { scheduledAt: istIsoString, meetLink: scheduleData.meetLink, status: 'INTERVIEW_SCHEDULED' }, status: 'INTERVIEW_SCHEDULED' };
            if (target === orgInspectorMember) setOrgInspectorMember(updatedApp); else setSelectedItem(updatedApp);
        } catch (error) {
            console.error(error);
            toast.error("Failed to schedule interview");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSkipInterview = async () => {
        const target = (orgInspectorMember && (orgInspectorMember.status || orgInspectorMember.interviewDetails)) ? orgInspectorMember : selectedItem;
        if (!target || !target._id) { toast.error('No applicant selected'); return; }

        // prepare default selection
        const defaultRole = (() => {
            if (target.role) return typeof target.role === 'string' ? target.role : (target.role.name || '');
            if (Array.isArray(target.preferredRoles) && target.preferredRoles.length) return typeof target.preferredRoles[0] === 'string' ? target.preferredRoles[0] : (target.preferredRoles[0]?.name || '');
            return '';
        })();

        setSkipAssignedRole(target.assignedRole || defaultRole || '');
        setSkipModalTarget(target);
        setShowAssignRoleModal(true);
    };

    const confirmSkipInterview = async () => {
        if (!skipModalTarget || !skipModalTarget._id) return toast.error('No applicant selected');
        const assignedRole = (skipAssignedRole || '').trim();
        if (!assignedRole) return toast.error('Assigned role is required to skip protocol');
        if (!window.confirm("Are you sure you want to skip the interview step?")) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.put(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/application/admin/skip-interview`, {
                applicantId: skipModalTarget._id
            }, { headers: { Authorization: `Bearer ${token}` } });

            toast.success("Interview Step Skipped");
            const fresh = await fetchData();
            const updated = (fresh?.apps || []).find(a => a._id === skipModalTarget._id) || { ...skipModalTarget, status: 'INTERVIEW_SKIPPED', interviewDetails: { ...skipModalTarget.interviewDetails, status: 'SKIPPED' } };

            // Persist assignedRole locally so Accept requires it and includes it in status update
            updated.assignedRole = assignedRole;
            if (skipModalTarget === orgInspectorMember) setOrgInspectorMember(updated); else setSelectedItem(updated);
            setShowAssignRoleModal(false);
            setSkipModalTarget(null);
        } catch (error) {
            toast.error("Failed to skip interview");
        } finally {
            setActionLoading(false);
        }
    };

    // Mark applicant as DID NOT ATTEND (NO-SHOW) -> rejected and tagged
    const handleMarkNoShow = async () => {
        if (!window.confirm("Mark applicant as DID NOT ATTEND (No-show)? This will reject the applicant.")) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const target = (orgInspectorMember && (orgInspectorMember.status || orgInspectorMember.interviewDetails)) ? orgInspectorMember : selectedItem;
            if (!target || !target._id) { toast.error('No applicant selected'); setActionLoading(false); return; }

            await axios.put(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/application/admin/mark-no-show`, {
                applicantId: target._id
            }, { headers: { Authorization: `Bearer ${token}` } });

            toast.success("Applicant marked as No-show and rejected");
            const fresh = await fetchData();
            const updated = (fresh?.apps || []).find(a => a._id === target._id) || { ...target, status: 'REJECTED', interviewDetails: { ...target.interviewDetails, status: 'NO_SHOW' } };
            if (target === orgInspectorMember) setOrgInspectorMember(updated); else setSelectedItem(updated);
        } catch (error) {
            console.error(error);
            toast.error("Failed to mark no-show");
        } finally {
            setActionLoading(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            
            const response = await axios.get(`${serverUrl}/application/admin/export-csv`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = `applicants_${new Date().toISOString().split('T')[0]}.csv`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success('CSV exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export CSV');
        }
    };

    const handleExportOrgCSV = async (orgCode) => {
        try {
            const token = localStorage.getItem("accessToken");
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            
            const response = await axios.get(`${serverUrl}/application/admin/export-org-csv/${orgCode}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = `${orgCode}_data_${new Date().toISOString().split('T')[0]}.csv`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success(`${orgCode} data exported successfully`);
        } catch (error) {
            console.error('Org export error:', error);
            toast.error('Failed to export organization data');
        }
    };

    const handleAdminDownload = async (fellowId, tenureIndex, docType, docName) => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(
                `${process.env.SERVER_URL || 'http://localhost:3001/api'}/fellowship/admin/download/${fellowId}/${tenureIndex}/${docType}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', docName || `${docType}_download.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            toast.error("Download failed");
        }
    };

    const handleUpdateState = async (state) => {
        try {
            const token = localStorage.getItem("accessToken");
            const target = orgInspectorMember || selectedItem;
            if (!target || !target._id) { toast.error('No fellow selected'); return; }

            await axios.put(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/admin/fellows/${target._id}`,
                { onboardingState: state },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`State: ${state}`);
            const fresh = await fetchData();
            const updated = (fresh?.fellows || []).find(f => f._id === target._id) || { ...target, onboardingState: state };
            if (target === orgInspectorMember) setOrgInspectorMember(updated); else setSelectedItem(updated);
        } catch (error) { toast.error("Update failed"); }
    };

    const searchParams = useSearchParams();
    useEffect(() => {
        if (loading) return;
        const email = searchParams.get('email');
        const type = searchParams.get('type');
        const orgCode = searchParams.get('orgCode');
        const memberEmail = searchParams.get('memberEmail');

        // legacy/email shortcuts (apps / fellows)
        if (email && type) {
            if (type === 'apps') {
                const item = apps.find(a => a.email === email);
                if (item) { setActiveTab('applications'); setSelectedItem(item); }
            } else if (type === 'fellows') {
                const item = fellows.find(f => f.email === email);
                if (item) { setActiveTab('fellows'); setSelectedItem(item); }
            }
            return; // prefer explicit email/type handling when present
        }

        // restore org inspector + nested member from query (persists view across reload)
        if (orgCode) {
            const org = orgs.find(o => o.code === orgCode);
            if (org) {
                setActiveTab('orgs');
                setSelectedItem(org);
                if (memberEmail) {
                    const mem = (fellows || []).find(f => f.email === memberEmail) || (apps || []).find(a => a.email === memberEmail);
                    if (mem) setOrgInspectorMember(mem);
                }
            }
        }
    }, [loading, searchParams, orgs, fellows, apps]);

    const filteredApps = apps.filter(a => {
        const matchesSearch = a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.lastName.toLowerCase().includes(searchTerm.toLowerCase());

        if (activeSubTab === 'PENDING') return matchesSearch && a.status === 'PENDING';
        if (activeSubTab === 'INTERVIEW') return matchesSearch && (a.status === 'INTERVIEW_SCHEDULED' || a.status === 'INTERVIEW_SKIPPED');
        if (activeSubTab === 'ARCHIVED') return matchesSearch && (a.status === 'ACCEPTED' || a.status === 'REJECTED');
        return matchesSearch; // ALL
    });

    // Visible orgs depending on org sub-tab (ACTIVE | ARCHIVED)
    const visibleOrgs = Array.isArray(orgs)
        ? orgs.filter(o => orgSubTab === 'ARCHIVED' ? !o.isActive : Boolean(o.isActive))
        : [];


    const ensureExternalLink = (url) => {
        if (!url) return "#";
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://${url}`;
    };

    const handleSaveOrg = async () => {
        if (!orgData.name || !orgData.code) { toast.error("Name and Code are required"); return; }
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const payload = { ...orgData };

            // Ensure selected roles (formVar1) are stored with descriptions when available
            if (Array.isArray(orgData.formVar1) && orgData.formVar1.length) {
                payload.availableRoles = orgData.formVar1.map(name => {
                    const existing = (orgData.availableRoles || []).find(r => r.name === name);
                    return existing ? { name: existing.name, description: existing.description || '' } : { name, description: '' };
                });
            } else {
                // fallback: if availableRoles present, ensure shape is correct
                payload.availableRoles = (orgData.availableRoles || []).map(r => ({ name: r.name || r, description: r.description || '' }));
            }

            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/application/admin/orgs`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Organization Saved");
            setIsEditingOrg(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save organization");
        } finally { setActionLoading(false); }
    };

    // Archive an organization (mark offline so no further applications accepted)
    const handleArchiveOrg = async () => {
        if (!orgData?.id) return toast.error('No organization selected');
        if (!window.confirm(`Archive node ${orgData.code}? This will make the node offline and prevent further applications.`)) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            await axios.put(`${serverUrl}/application/admin/orgs/${orgData.id}/archive`, {}, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Organization archived');
            setIsEditingOrg(false);
            fetchData();
        } catch (err) {
            console.error('Archive failed', err);
            toast.error(err.response?.data?.message || 'Archive failed');
        } finally { setActionLoading(false); }
    }; 

    const TenureTimeline = ({ tenures }) => (
        <div className="relative pl-6 border-l border-cyan-900/50 space-y-8 ml-2">
            {tenures.map((t, i) => (
                <div key={i} className="relative">
                    <div className={`absolute -left-[30px] top-0 w-3 h-3 border border-black ${t.status === 'ACTIVE' ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'bg-gray-800'}`} />
                    <div className="bg-black border border-white/10 p-4 relative group hover:border-cyan-500/50 transition-colors">
                        <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-white/20" />
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-white/20" />

                        <div className="flex justify-between items-start mb-2">
                            <span className="font-mono text-xs text-cyan-400 font-bold uppercase tracking-wider">{t.role}</span>
                            <span className={`text-[9px] font-mono uppercase px-2 py-0.5 border ${t.status === 'ACTIVE' ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10' : 'border-gray-700 text-gray-500'}`}>{t.status}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono flex justify-between">
                            <span>{t.startDate || 'N/A'} — {t.endDate || 'PRESENT'}</span>
                            <span className="text-white/40">{t.cohort}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderOrgInspector = () => {
        const orgApps = apps.filter(a => a.orgCode === selectedItem.code && a.status === 'PENDING');
        const orgInterviewees = apps.filter(a => a.orgCode === selectedItem.code && (a.status === 'INTERVIEW_SCHEDULED' || a.status === 'INTERVIEW_SKIPPED'));
        const orgRejected = apps.filter(a => a.orgCode === selectedItem.code && a.status === 'REJECTED');
        const orgFellows = fellows.filter(f => f.tenures?.some(t => t.orgCode === selectedItem.code)); // Robust filtering

        return (
            <div className="space-y-8">
                {orgInspectorMember && (
                    <motion.div initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 24, opacity: 0 }} transition={{ duration: 0.18 }} className="w-full p-4 border border-white/10 bg-white/[0.01] space-y-4">
                        <div className="flex items-start gap-4">
                            <button onClick={() => { setOrgInspectorMember(null); router.replace(`${window.location.pathname}?orgCode=${selectedItem?.code || ''}`); }} className="text-gray-400 hover:text-white p-1">
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="flex-1 flex items-center gap-4">
                                <div className="w-16 h-16 border border-white/10 flex items-center justify-center text-3xl font-bold bg-white/5 text-purple-500">{orgInspectorMember.firstName?.[0] || 'U'}</div>
                                <div className="flex-1">
                                    <div className="text-lg font-bold uppercase tracking-tight">{orgInspectorMember.firstName} {orgInspectorMember.lastName}</div>
                                    <div className="text-xs font-mono text-gray-400">{orgInspectorMember.email}</div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="px-2 py-0.5 border border-purple-500/30 text-[9px] text-purple-400 uppercase">{orgInspectorMember.onboardingState || orgInspectorMember.status}</div>
                                        <button onClick={() => {
                                            const isApplicant = orgInspectorMember && (typeof orgInspectorMember.status === 'string' || orgInspectorMember.interviewDetails);
                                            const applicantStatuses = ['PENDING','INTERVIEW_SCHEDULED','INTERVIEW_SKIPPED','REJECTED'];
                                            if (isApplicant && applicantStatuses.includes((orgInspectorMember.status || '').toUpperCase())) {
                                                // Open in Applications (Interview tab) for applicants who are not yet fellows
                                                setActiveTab('applications');
                                                setActiveSubTab('INTERVIEW');
                                                setSelectedItem(orgInspectorMember);
                                                setOrgInspectorMember(null);
                                                router.replace(`${window.location.pathname}?type=apps&email=${encodeURIComponent(orgInspectorMember.email)}`);
                                            } else {
                                                // Default: open full fellow profile
                                                setActiveTab('fellows');
                                                setSelectedItem(orgInspectorMember);
                                                setOrgInspectorMember(null);
                                                router.replace(`${window.location.pathname}?type=fellows&email=${encodeURIComponent(orgInspectorMember.email)}`);
                                            }
                                        }} className="text-xs text-gray-400 hover:text-white">Open full profile</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* If this nested item is a fellow, show tenure timeline; if it's an application, show interview controls */}
                        <div className="pt-4">
                            {orgInspectorMember.tenures ? (
                                <TenureTimeline tenures={orgInspectorMember.tenures} />
                            ) : (
                                <div className="space-y-3">
                                    <div className="text-[10px] text-gray-500 uppercase font-mono tracking-widest flex justify-between">
                                        <span>Motivation_Payload</span>
                                        <span className={((orgInspectorMember?.whyJoinDeepCytes ?? orgInspectorMember?.data?.whyJoin ?? '').length < 100) ? "text-red-500" : "text-green-500"}>
                                            LEN_{(orgInspectorMember?.whyJoinDeepCytes ?? orgInspectorMember?.data?.whyJoin ?? '').length}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-black/40 border border-white/5 text-xs text-gray-400 font-mono leading-relaxed max-h-28 overflow-y-auto custom-scrollbar">
                                        {orgInspectorMember.whyJoinDeepCytes || orgInspectorMember.data?.whyJoin || "NO_DATA_FOUND"}
                                    </div>

                                    {/* Interview controls (same behavior as applications inspector but local to nested panel) */}
                                    {orgInspectorMember.status === 'PENDING' || orgInspectorMember.status === 'INTERVIEW_SCHEDULED' || orgInspectorMember.interviewDetails ? (
                                        <div className="space-y-3 pt-3">
                                            {orgInspectorMember.status === 'PENDING' && (!orgInspectorMember.interviewDetails || orgInspectorMember.interviewDetails.status === 'PENDING') ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <button onClick={() => setShowScheduleModal(true)} className="h-10 border border-cyan-500/50 text-cyan-400 bg-cyan-900/10 hover:bg-cyan-500/20 text-xs font-bold uppercase tracking-wider">Schedule Interview</button>
                                                    <button onClick={handleSkipInterview} className="h-10 border border-gray-600/50 text-gray-500 hover:text-white hover:border-white/50 text-xs font-bold uppercase tracking-wider">Skip Protocol</button>
                                                </div>
                                            ) : orgInspectorMember.status === 'INTERVIEW_SCHEDULED' ? (
                                                <div className="space-y-3">
                                                    <div className="p-3 bg-orange-900/10 border border-orange-500/30 space-y-2">
                                                        <div className="flex items-center justify-between text-xs text-gray-400 font-mono uppercase">
                                                            <span>Scheduled_Time:</span>
                                                            <span className="text-xs">{orgInspectorMember.interviewDetails?.scheduledAt ? new Date(orgInspectorMember.interviewDetails.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs text-gray-400 font-mono uppercase">
                                                            <span>Meet_Link:</span>
                                                            <a href={orgInspectorMember.interviewDetails?.meetLink?.startsWith('http') ? orgInspectorMember.interviewDetails.meetLink : `https://${orgInspectorMember.interviewDetails?.meetLink}`} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-cyan-400 hover:underline truncate max-w-[200px]">{orgInspectorMember.interviewDetails?.meetLink || 'N/A'}</a>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => { setScheduleData({ scheduledAt: orgInspectorMember.interviewDetails?.scheduledAt ? new Date(orgInspectorMember.interviewDetails.scheduledAt).toISOString().slice(0,16) : '', meetLink: orgInspectorMember.interviewDetails?.meetLink || '' }); setShowScheduleModal(true); }} className="w-full h-10 border border-orange-500/50 text-orange-400 bg-orange-900/10 hover:bg-orange-500/20 text-xs font-bold uppercase tracking-wider">Reschedule Interview</button>
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                <div className="flex items-start gap-6 border-b border-white/10 pb-8">
                    <div className="w-20 h-20 border border-white/20 flex items-center justify-center text-4xl font-bold bg-white/5 text-green-500">
                        {selectedItem.name[0]}
                    </div>
                    <div className="flex-1 space-y-2">
                        <h2 className="text-3xl font-bold uppercase tracking-tight text-white">{selectedItem.name}</h2>
                        <div className="text-xs font-mono text-gray-400 grid grid-cols-3 gap-2">
                            <span className="block p-2 border border-white/10">CODE: {selectedItem.code}</span>
                            <span className={`block p-2 border border-white/10 ${selectedItem.isActive ? 'text-green-500' : 'text-red-500'}`}>{selectedItem.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                            <button
                                onClick={() => handleExportOrgCSV(selectedItem.code)}
                                className="p-2 border border-cyan-500/50 text-cyan-500 hover:bg-cyan-500 hover:text-black flex items-center justify-center gap-2 transition-all text-[10px] font-bold uppercase tracking-widest"
                                title="Download organization data as CSV"
                            >
                                <Download className="w-3.5 h-3.5" /> CSV
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Personnel_Manifest
                    </h3>

                    <div className="space-y-6">
                        {/* Org Fellows */}
                        <div>
                            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 border-b border-purple-500/20 pb-1">deployed_fellows ({orgFellows.length})</h4>
                            {orgFellows.length > 0 ? (
                                <div className="grid gap-2">
                                    {orgFellows.map(f => (
                                        <div
                                            key={f._id}
                                            onClick={() => { setOrgInspectorMember(f); router.replace(`${window.location.pathname}?orgCode=${selectedItem?.code}&memberEmail=${encodeURIComponent(f.email)}`); }}
                                            className="p-3 bg-white/5 border border-white/10 flex justify-between items-center group cursor-pointer hover:border-purple-500/50 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-white group-hover:text-purple-400">{f.firstName} {f.lastName}</div>
                                                <div className="text-[10px] text-gray-500 font-mono">{f.email}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="px-2 py-0.5 border border-purple-500/30 text-[9px] text-purple-400 uppercase">{f.onboardingState}</div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); window.open(`/applications?type=fellows&email=${f.email}`, '_blank'); }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10"
                                                >
                                                    <ExternalLink className="w-3 h-3 text-purple-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="text-xs text-gray-600 font-mono italic">NO ACTIVE UNITS</div>}
                        </div>

                        {/* Org Interviewees */}
                        <div>
                            <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2 border-b border-orange-500/20 pb-1">interview_pipeline ({orgInterviewees.length})</h4>
                            {orgInterviewees.length > 0 ? (() => {
                                const now = new Date();
                                const scheduled = orgInterviewees.filter(a => a.interviewDetails?.scheduledAt).map(a => ({ ...a, _sched: new Date(a.interviewDetails.scheduledAt) }));
                                const unscheduled = orgInterviewees.filter(a => !a.interviewDetails?.scheduledAt);
                                const upcoming = scheduled.filter(a => a._sched >= now).sort((x, y) => x._sched - y._sched);
                                const past = scheduled.filter(a => a._sched < now).sort((x, y) => y._sched - x._sched);
                                return (
                                    <div className="grid gap-2">
                                        {upcoming.map(a => (
                                            <div key={a._id} onClick={() => { setOrgInspectorMember(a); router.replace(`${window.location.pathname}?orgCode=${selectedItem?.code}&memberEmail=${encodeURIComponent(a.email)}`); }} className="p-3 bg-white/5 border border-white/10 flex justify-between items-center group cursor-pointer hover:border-orange-500/50 transition-colors">
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-white group-hover:text-orange-400">{a.firstName} {a.lastName}</div>
                                                    <div className="text-[10px] text-gray-500 font-mono">{a.email}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="px-2 py-0.5 border border-orange-500/30 text-[9px] text-orange-400 uppercase">{a.status}</div>
                                                    {a.interviewDetails?.scheduledAt && (<div className="text-[10px] text-gray-400 font-mono">{new Date(a.interviewDetails.scheduledAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</div>)}
                                                </div>
                                            </div>
                                        ))}

                                        {unscheduled.map(a => (
                                            <div key={a._id} onClick={() => { setOrgInspectorMember(a); router.replace(`${window.location.pathname}?orgCode=${selectedItem?.code}&memberEmail=${encodeURIComponent(a.email)}`); }} className="p-3 bg-white/5 border border-white/10 flex justify-between items-center group cursor-pointer hover:border-orange-500/50 transition-colors">
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-white group-hover:text-orange-400">{a.firstName} {a.lastName}</div>
                                                    <div className="text-[10px] text-gray-500 font-mono">{a.email}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="px-2 py-0.5 border border-orange-500/30 text-[9px] text-orange-400 uppercase">{a.status}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono">UNSCHEDULED</div>
                                                </div>
                                            </div>
                                        ))}

                                        {past.length > 0 && <div className="border-t border-white/10 my-2" />}

                                        {past.map(a => (
                                            <div key={a._id} onClick={() => { setOrgInspectorMember(a); router.replace(`${window.location.pathname}?orgCode=${selectedItem?.code}&memberEmail=${encodeURIComponent(a.email)}`); }} className="p-3 bg-white/5 border border-white/10 flex justify-between items-center group cursor-pointer hover:border-orange-500/50 transition-colors">
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-white group-hover:text-orange-400">{a.firstName} {a.lastName}</div>
                                                    <div className="text-[10px] text-gray-500 font-mono">{a.email}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="px-2 py-0.5 border border-orange-500/30 text-[9px] text-orange-400 uppercase">{a.status}</div>
                                                    {a.interviewDetails?.scheduledAt && (<div className="text-[10px] text-gray-400 font-mono">{new Date(a.interviewDetails.scheduledAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</div>)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })() : <div className="text-xs text-gray-600 font-mono italic">NO ACTIVE INTERVIEWS</div>}
                        </div>

                        {/* Org Applicants */}
                        <div>
                            <h4 className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-2 border-b border-cyan-500/20 pb-1">pending_forms ({orgApps.length})</h4>
                            {orgApps.length > 0 ? (
                                <div className="grid gap-2">
                                    {orgApps.map(a => (
                                        <div
                                            key={a._id}
                                            onClick={() => { setOrgInspectorMember(a); router.replace(`${window.location.pathname}?orgCode=${selectedItem?.code}&memberEmail=${encodeURIComponent(a.email)}`); }}
                                            className="p-3 bg-white/5 border border-white/10 flex justify-between items-center group cursor-pointer hover:border-cyan-500/50 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-white group-hover:text-cyan-400">{a.firstName} {a.lastName}</div>
                                                <div className="text-[10px] text-gray-500 font-mono">{a.email}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={`px-2 py-0.5 border text-[9px] uppercase ${a.status === 'ACCEPTED' ? 'text-green-500 border-green-500/30' : 'text-yellow-500 border-yellow-500/30'}`}>{a.status}</div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); window.open(`/applications?type=apps&email=${a.email}`, '_blank'); }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10"
                                                >
                                                    <ExternalLink className="w-3 h-3 text-cyan-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="text-xs text-gray-600 font-mono italic">NO INCOMING SIGNALS</div>}
                        </div>

                        {/* Rejected Applicants */}
                        <div>
                            <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2 border-b border-red-500/20 pb-1">rejected_applicants ({orgRejected.length})</h4>
                            {orgRejected.length > 0 ? (
                                <div className="grid gap-2">
                                    {orgRejected.map(a => (
                                        <div
                                            key={a._id}
                                            onClick={() => { setOrgInspectorMember(a); router.replace(`${window.location.pathname}?orgCode=${selectedItem?.code}&memberEmail=${encodeURIComponent(a.email)}`); }}
                                            className="p-3 bg-white/5 border border-white/10 flex justify-between items-center group cursor-pointer hover:border-red-500/50 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-white group-hover:text-red-400">{a.firstName} {a.lastName}</div>
                                                <div className="text-[10px] text-gray-500 font-mono">{a.email}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="px-2 py-0.5 border text-[9px] text-red-400 border-red-500/30 uppercase">{a.status}</div>
                                                {a.interviewDetails?.status === 'NO_SHOW' && (
                                                    <div className="text-[9px] px-2 py-0.5 bg-red-900/10 border border-red-500/30 text-red-400 uppercase">NO-SHOW</div>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); window.open(`/applications?type=apps&email=${a.email}`, '_blank'); }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10"
                                                >
                                                    <ExternalLink className="w-3 h-3 text-red-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="text-xs text-gray-600 font-mono italic">NO REJECTED APPLICANTS</div>}
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Fellowship_Config</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 border border-white/10">
                            <span className="text-[10px] text-gray-500 uppercase block mb-1">Termination_Date</span>
                            <span className="text-sm font-mono text-white">{selectedItem.endDate ? new Date(selectedItem.endDate).toLocaleDateString() : 'INDEFINITE'}</span>

                            <div className="mt-3">
                                <span className="text-[10px] text-gray-500 uppercase block mb-1">Tenure End Date</span>
                                <span className="text-sm font-mono text-gray-400">{selectedItem.defaultTenureEndDate ? new Date(selectedItem.defaultTenureEndDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10">
                            <span className="text-[10px] text-gray-500 uppercase block mb-1">Allowed_Domains</span>
                            <div className="flex flex-wrap gap-1">
                                {selectedItem.emailDomainWhitelist.map(d => <span key={d} className="text-[9px] px-1 bg-white/10 rounded">{d}</span>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen overflow-auto bg-black text-white flex flex-col font-mono selection:bg-cyan-500/50 selection:text-black">
            <Navbar />

            <div className="flex-1 flex flex-col md:flex-row overflow-auto min-h-screen">
                {/* Cyber Sidebar */}
                <div className="w-full md:w-16 h-full bg-black border-r border-white/10 flex md:flex-col flex-row items-center md:py-6 py-2 gap-2 md:gap-6 shrink-0 relative z-30">
                    <div className="w-10 h-10 md:w-12 md:h-12 border border-cyan-500 flex items-center justify-center text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                        <Terminal className="w-6 h-6" />
                    </div>

                    <nav className="flex md:flex-col flex-row gap-2 md:gap-4 w-full px-2 md:mt-4 mt-0">
                        {[
                            { id: 'applications', icon: <FileText className="w-6 h-6" />, label: 'REQ' },
                            { id: 'fellows', icon: <Users className="w-6 h-6" />, label: 'OPS' },
                            { id: 'orgs', icon: <Globe className="w-6 h-6" />, label: 'NET' },
                            { id: 'projects', icon: <Code className="w-6 h-6" />, label: 'PRJ' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => { setActiveTab(t.id); setSelectedItem(null); }}
                                className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition-all relative group border ${activeTab === t.id ? 'bg-white/10 border-white text-white' : 'border-transparent text-gray-600 hover:text-cyan-400 hover:border-cyan-900/50'}`}
                            >
                                {t.icon}
                                <span className="hidden md:block absolute left-full ml-4 bg-black border border-white/20 px-3 py-1.5 text-xs text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                    {t.label}
                                </span>
                            </button>
                        ))}
                    </nav>

                    <div className="flex-1" />
                    <button onClick={() => { fetchData(); fetchProjects(); }} className="w-10 h-10 md:w-12 md:h-12 border border-white/10 hover:border-cyan-500 hover:text-cyan-500 transition-colors flex items-center justify-center">
                        <History className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="h-2 md:h-4" />
                </div>

                {/* Main Viewport */}
                <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-black relative">
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />

                    {/* Header */}
                    <header className="h-16 md:h-20 border-b border-white/10 flex flex-col md:flex-row items-center justify-between px-2 md:px-8 bg-black z-20 gap-2 md:gap-0">
                        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                            <h2 className="text-lg md:text-2xl font-bold tracking-tighter text-white uppercase flex items-center gap-2">
                                <span className="text-cyan-500">/</span> {activeTab}_CONSOLE
                            </h2>
                            <span className="text-xs bg-cyan-900/20 border border-cyan-500/30 text-cyan-400 px-2 md:px-3 py-1 rounded-none font-bold">
                                CNT: {activeTab === 'applications' ? filteredApps.length : activeTab === 'fellows' ? fellows.length : (orgSubTab === 'ARCHIVED' ? orgs.filter(o => !o.isActive).length : orgs.filter(o => o.isActive).length)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                            <div className="relative flex-1 md:w-96 group">
                                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-cyan-500" />
                                <input
                                    type="text"
                                    placeholder="SEARCH_QUERY..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full h-10 bg-black border border-white/20 pl-9 md:pl-11 pr-4 text-sm focus:border-cyan-500 focus:outline-none transition-all placeholder:text-gray-700 font-mono text-cyan-100 uppercase"
                                />
                            </div>
                            {activeTab === 'applications' && (
                                <button
                                    onClick={handleExportCSV}
                                    className="h-10 px-3 md:px-4 border border-green-500/50 text-green-500 hover:bg-green-500 hover:text-black flex items-center gap-2 transition-all text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                                    title="Export applicants to CSV"
                                >
                                    <Download className="w-4 h-4" /> <span className="hidden md:inline">CSV</span>
                                </button>
                            )}
                            {activeTab === 'orgs' && (
                                <button onClick={() => { setOrgData({ name: '', code: '', emailDomainWhitelist: [], endDate: sixMonthsFromNow(), defaultTenureEndDate: null, formVar1: [], availableRoles: [], isActive: true, adminPassword: '' }); setIsEditingOrg(true); }} className="h-10 w-10 border border-white/20 hover:border-cyan-500 hover:text-cyan-500 flex items-center justify-center transition-colors">
                                    <Plus className="w-5 h-5" />
                                </button>
                            )}
                            {activeTab === 'fellows' && (
                                <button
                                    onClick={() => {
                                        setManualFellowData({ email: '', firstName: '', lastName: '', role: '', orgCode: '', cohort: 'C1', startDate: new Date().toISOString().split('T')[0] });
                                        setShowManualModal(true);
                                    }}
                                    className="h-10 px-4 border border-purple-500/50 text-purple-500 hover:bg-purple-500 hover:text-white flex items-center gap-2 transition-all text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4" /> MANUAL_ONBOARD
                                </button>
                            )}
                            {activeTab === 'projects' && (
                                <button
                                    onClick={() => {
                                        setNewProjectData({
                                            title: '',
                                            description: '',
                                            supportedLinks: [],
                                            contributors: [],
                                            isActive: true
                                        });
                                        setShowCreateProjectModal(true);
                                    }}
                                    className="h-10 px-4 border border-orange-500/50 text-orange-500 hover:bg-orange-500 hover:text-white flex items-center gap-2 transition-all text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4" /> NEW_PROJECT
                                </button>
                            )}
                        </div>
                    </header>

                    {/* Sub-tabs for Applications */}
                    {activeTab === 'applications' && (
                        <div className="flex bg-black border-b border-white/10 px-2 md:px-8 h-10 md:h-12 items-center gap-4 md:gap-8 relative z-20 overflow-x-auto">
                            {['PENDING', 'INTERVIEW', 'ARCHIVED', 'ALL'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setActiveSubTab(st)}
                                    className={`relative h-full text-[10px] font-bold tracking-[0.2em] transition-all flex items-center ${activeSubTab === st ? 'text-cyan-400' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {st}
                                    {activeSubTab === st && <motion.div layoutId="app-sub-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />}
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'orgs' && (
                        <div className="flex bg-black border-b border-white/10 px-2 md:px-8 h-10 md:h-12 items-center gap-4 md:gap-8 relative z-20 overflow-x-auto">
                            {['ACTIVE', 'ARCHIVED'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setOrgSubTab(st)}
                                    className={`relative h-full text-[10px] font-bold tracking-[0.2em] transition-all flex items-center ${orgSubTab === st ? 'text-cyan-400' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {st}
                                    {orgSubTab === st && <motion.div layoutId="org-sub-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Content List */}
                    <div ref={listRef} onScroll={saveListScroll} className="flex-1 min-h-0 overflow-y-auto p-0 custom-scrollbar z-10">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-6">
                                <div className="w-16 h-16 border-2 border-cyan-500 border-t-white animate-spin rounded-full" />
                                <p className="text-sm font-mono text-cyan-500 animate-pulse uppercase tracking-widest">ESTABLISHING_UPLINK...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1">
                                {activeTab === 'applications' && (
                                    // Special sorting for INTERVIEW sub-tab: upcoming (asc) -> separator -> past (desc)
                                    activeSubTab === 'INTERVIEW' ? (() => {
                                        const now = new Date();
                                        const interviewApps = filteredApps.slice();
                                        const scheduled = interviewApps.filter(a => a.interviewDetails?.scheduledAt).map(a => ({ ...a, _sched: new Date(a.interviewDetails.scheduledAt) }));
                                        const unscheduled = interviewApps.filter(a => !a.interviewDetails?.scheduledAt);
                                        const upcoming = scheduled.filter(a => a._sched >= now).sort((x, y) => x._sched - y._sched);
                                        const past = scheduled.filter(a => a._sched < now).sort((x, y) => y._sched - x._sched);
                                        let counter = 0;
                                        return (
                                            <>
                                                {upcoming.map((app, i) => { counter++; const orgName = getOrgName(app.orgCode); return (
                                                    <div key={app._id} onClick={() => setSelectedItem(app)} className={`group px-8 py-5 border-b border-white/10 hover:bg-white/5 cursor-pointer flex items-center justify-between transition-all ${selectedItem?._id === app._id ? 'bg-cyan-900/10 border-l-[6px] border-l-cyan-500' : 'border-l-[6px] border-l-transparent'}`}>
                                                        <div className="flex items-center gap-8">
                                                            <span className="text-sm font-mono text-gray-600 w-10">{String(counter).padStart(2, '0')}</span>
                                                            <div>
                                                                <h3 className="font-bold text-xl text-white group-hover:text-cyan-400 transition-colors uppercase tracking-widest mb-1.5">
                                                                    {app.firstName} {app.lastName}{orgName && (
                                                                        <span className="ml-2 text-[10px] px-2 py-0.5 bg-blue-900/10 border border-blue-500/30 text-blue-400 uppercase">
                                                                            {orgName}
                                                                        </span>
                                                                    )}
                                                                </h3>
                                                                <div className="flex gap-6 text-xs font-mono text-gray-500 items-center flex-wrap">
                                                                    <span className="text-white/60">{app.email}</span>
                                                                    <span className="inline-flex gap-2 items-center">
                                                                        {(() => {
                                                                            const displayRoles = (app.preferredRoles && app.preferredRoles.length)
                                                                                ? app.preferredRoles.slice(0, 2)
                                                                                : (app.data?.preferredRoles && app.data.preferredRoles.length)
                                                                                    ? app.data.preferredRoles.slice(0, 2)
                                                                                    : [(typeof app.role === 'object' ? app.role?.name : app.role)].filter(Boolean);
                                                                            return (
                                                                                <>
                                                                                    {displayRoles.map((r, idx) => (
                                                                                        <span key={idx} className="text-[10px] px-2 py-0.5 bg-cyan-900/10 border border-cyan-500/30 text-cyan-400 uppercase">
                                                                                            {r}
                                                                                        </span>
                                                                                    ))}
                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </span>
                                                                    {app.processedBy && (<span className="text-gray-400 border border-white/10 px-2 py-0.5 text-[10px] bg-white/5">AUTH: {app.processedBy}</span>)}
                                                                    {app.interviewDetails?.status === 'NO_SHOW' && (
                                                                        <span className="text-[9px] px-2 py-0.5 bg-red-900/10 border border-red-500/30 text-red-400 uppercase">NO-SHOW</span>
                                                                    )}
                                                                    {app.interviewDetails?.scheduledAt && (<span className="text-orange-400 border border-orange-500/30 px-2 py-0.5 text-[10px] bg-orange-500/5 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(app.interviewDetails.scheduledAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={`px-4 py-1.5 border text-xs font-bold uppercase tracking-widest ${app.status === 'ACCEPTED' ? 'border-green-500/50 text-green-500 bg-green-500/5' : app.status === 'REJECTED' ? 'border-red-500/50 text-red-500 bg-red-500/5' : app.status === 'INTERVIEW_SCHEDULED' ? 'border-orange-500/50 text-orange-500 bg-orange-500/5' : 'border-yellow-500/50 text-yellow-500 bg-yellow-500/5'}`}>{app.status}</div>
                                                    </div>
                                                ); })}

                                                {unscheduled.length > 0 && (
                                                    <div className="px-8 py-3 text-xs font-mono text-gray-500">Unscheduled / Pending interviews</div>
                                                )}
                                                {unscheduled.map((app) => { counter++; const orgName = getOrgName(app.orgCode); return (
                                                    <div key={app._id} onClick={() => setSelectedItem(app)} className={`group px-8 py-5 border-b border-white/10 hover:bg-white/5 cursor-pointer flex items-center justify-between transition-all ${selectedItem?._id === app._id ? 'bg-cyan-900/10 border-l-[6px] border-l-cyan-500' : 'border-l-[6px] border-l-transparent'}`}>
                                                        <div className="flex items-center gap-8">
                                                            <span className="text-sm font-mono text-gray-600 w-10">{String(counter).padStart(2, '0')}</span>
                                                            <div>
                                                                <h3 className="font-bold text-xl text-white group-hover:text-cyan-400 transition-colors uppercase tracking-widest mb-1.5">
                                                                    {app.firstName} {app.lastName}{orgName && (
                                                                        <span className="ml-2 text-[10px] px-2 py-0.5 bg-blue-900/10 border border-blue-500/30 text-blue-400 uppercase">
                                                                            {orgName}
                                                                        </span>
                                                                    )}
                                                                </h3>
                                                                <div className="flex gap-6 text-xs font-mono text-gray-500 items-center flex-wrap">
                                                                    <span className="text-white/60">{app.email}</span>
                                                                    {app.interviewDetails?.status === 'NO_SHOW' && (
                                                                        <span className="text-[9px] px-2 py-0.5 bg-red-900/10 border border-red-500/30 text-red-400 uppercase">NO-SHOW</span>
                                                                    )}
                                                                    {getOrgName(app.orgCode) && (
                                                                        <span className="text-[10px] px-2 py-0.5 bg-blue-900/10 border border-blue-500/30 text-blue-400 uppercase">
                                                                            {getOrgName(app.orgCode)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={`px-4 py-1.5 border text-xs font-bold uppercase tracking-widest ${app.status === 'ACCEPTED' ? 'border-green-500/50 text-green-500 bg-green-500/5' : app.status === 'REJECTED' ? 'border-red-500/50 text-red-500 bg-red-500/5' : app.status === 'INTERVIEW_SCHEDULED' ? 'border-orange-500/50 text-orange-500 bg-orange-500/5' : 'border-yellow-500/50 text-yellow-500 bg-yellow-500/5'}`}>{app.status}</div>
                                                    </div>
                                                ); })}

                                                {past.length > 0 && <div className="border-t border-white/10 my-4" />}

                                                {past.map((app, i) => { counter++; const orgName = getOrgName(app.orgCode); return (
                                                    <div key={app._id} onClick={() => setSelectedItem(app)} className={`group px-8 py-5 border-b border-white/10 hover:bg-white/5 cursor-pointer flex items-center justify-between transition-all ${selectedItem?._id === app._id ? 'bg-cyan-900/10 border-l-[6px] border-l-cyan-500' : 'border-l-[6px] border-l-transparent'}`}>
                                                        <div className="flex items-center gap-8">
                                                            <span className="text-sm font-mono text-gray-600 w-10">{String(counter).padStart(2, '0')}</span>
                                                            <div>
                                                                <h3 className="font-bold text-xl text-white group-hover:text-cyan-400 transition-colors uppercase tracking-widest mb-1.5">
                                                                    {app.firstName} {app.lastName}{orgName && (
                                                                        <span className="ml-2 text-[10px] px-2 py-0.5 bg-blue-900/10 border border-blue-500/30 text-blue-400 uppercase">
                                                                            {orgName}
                                                                        </span>
                                                                    )}
                                                                </h3>
                                                                <div className="flex gap-6 text-xs font-mono text-gray-500 items-center flex-wrap">
                                                                    <span className="text-white/60">{app.email}</span>
                                                                    {app.interviewDetails?.status === 'NO_SHOW' && (
                                                                        <span className="text-[9px] px-2 py-0.5 bg-red-900/10 border border-red-500/30 text-red-400 uppercase">NO-SHOW</span>
                                                                    )}
                                                                    {getOrgName(app.orgCode) && (
                                                                        <span className="text-[10px] px-2 py-0.5 bg-blue-900/10 border border-blue-500/30 text-blue-400 uppercase">
                                                                            {getOrgName(app.orgCode)}
                                                                        </span>
                                                                    )}
                                                                    {app.interviewDetails?.scheduledAt && (<span className="text-orange-400 border border-orange-500/30 px-2 py-0.5 text-[10px] bg-orange-500/5 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(app.interviewDetails.scheduledAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={`px-4 py-1.5 border text-xs font-bold uppercase tracking-widest ${app.status === 'ACCEPTED' ? 'border-green-500/50 text-green-500 bg-green-500/5' : app.status === 'REJECTED' ? 'border-red-500/50 text-red-500 bg-red-500/5' : app.status === 'INTERVIEW_SCHEDULED' ? 'border-orange-500/50 text-orange-500 bg-orange-500/5' : 'border-yellow-500/50 text-yellow-500 bg-yellow-500/5'}`}>{app.status}</div>
                                                    </div>
                                                ); })}
                                            </>
                                        );
                                    })() : (
                                        filteredApps.map((app, idx) => {
                                            const orgName = getOrgName(app.orgCode);
                                            return (
                                                <div
                                                    key={app._id}
                                                    onClick={() => setSelectedItem(app)}
                                                    className={`group px-8 py-5 border-b border-white/10 hover:bg-white/5 cursor-pointer flex items-center justify-between transition-all ${selectedItem?._id === app._id ? 'bg-cyan-900/10 border-l-[6px] border-l-cyan-500' : 'border-l-[6px] border-l-transparent'}`}
                                                >
                                                    <div className="flex items-center gap-8">
                                                        <span className="text-sm font-mono text-gray-600 w-10">{String(idx + 1).padStart(2, '0')}</span>
                                                        <div>
                                                            <h3 className="font-bold text-xl text-white group-hover:text-cyan-400 transition-colors uppercase tracking-widest mb-1.5">
                                                                {app.firstName} {app.lastName}{orgName && (
                                                                    <span className="ml-2 text-[10px] px-2 py-0.5 bg-blue-900/10 border border-blue-500/30 text-blue-400 uppercase">
                                                                        {orgName}
                                                                    </span>
                                                                )}
                                                            </h3>
                                                            <div className="flex gap-6 text-xs font-mono text-gray-500 items-center flex-wrap">
                                                                <span className="text-white/60">{app.email}</span>
                                                                {(() => {
                                                                    const displayRoles = (app.preferredRoles && app.preferredRoles.length)
                                                                        ? app.preferredRoles.slice(0, 2)
                                                                        : (app.data?.preferredRoles && app.data?.preferredRoles.length)
                                                                            ? app.data.preferredRoles.slice(0, 2)
                                                                            : [(typeof app.role === 'object' ? app.role?.name : app.role)].filter(Boolean);
                                                                    return (
                                                                        <>
                                                                            {displayRoles.map((r, idx) => (
                                                                                <span key={idx} className={`text-[10px] px-2 py-0.5 bg-cyan-900/10 border border-cyan-500/30 text-cyan-400 uppercase ${idx > 0 ? 'ml-2' : ''}`}>
                                                                                    {r}
                                                                                </span>
                                                                            ))}
                                                                        </>
                                                                    );
                                                                })()}
                                                                {app.processedBy && (
                                                                    <span className="text-gray-400 border border-white/10 px-2 py-0.5 text-[10px] bg-white/5">AUTH: {app.processedBy}</span>
                                                                )}
                                                                {app.interviewDetails?.status === 'NO_SHOW' && (
                                                                    <span className="text-[9px] px-2 py-0.5 bg-red-900/10 border border-red-500/30 text-red-400 uppercase">NO-SHOW</span>
                                                                )}

                                                                {app.interviewDetails?.scheduledAt && (
                                                                    <span className="text-orange-400 border border-orange-500/30 px-2 py-0.5 text-[10px] bg-orange-500/5 flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        {new Date(app.interviewDetails.scheduledAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`px-4 py-1.5 border text-xs font-bold uppercase tracking-widest ${app.status === 'ACCEPTED' ? 'border-green-500/50 text-green-500 bg-green-500/5' : app.status === 'REJECTED' ? 'border-red-500/50 text-red-500 bg-red-500/5' : app.status === 'INTERVIEW_SCHEDULED' ? 'border-orange-500/50 text-orange-500 bg-orange-500/5' : 'border-yellow-500/50 text-yellow-500 bg-yellow-500/5'}`}>
                                                        {app.status}
                                                    </div>
                                                </div>
                                            );
                                        })))
                                    }


                                {activeTab === 'fellows' && fellows.filter(f => f.email.toLowerCase().includes(searchTerm.toLowerCase())).map((fellow, idx) => (
                                    <div
                                        key={fellow._id}
                                        onClick={() => setSelectedItem(fellow)}
                                        className={`group px-8 py-5 border-b border-white/10 hover:bg-white/5 cursor-pointer flex items-center justify-between transition-all ${selectedItem?._id === fellow._id ? 'bg-purple-900/10 border-l-[6px] border-l-purple-500' : 'border-l-[6px] border-l-transparent'}`}
                                    >
                                        <div className="flex items-center gap-8">
                                            <span className="text-sm font-mono text-gray-600 w-10">{String(idx + 1).padStart(2, '0')}</span>
                                            <div>
                                                <h3 className="font-bold text-xl text-white group-hover:text-purple-400 transition-colors uppercase tracking-widest mb-1.5">{fellow.firstName} {fellow.lastName}</h3>
                                                <div className="flex gap-6 text-xs font-mono text-gray-500 items-center">
                                                    <span className="bg-white/10 px-2 py-0.5 text-white">{fellow.globalPid || 'NO_ID'}</span>
                                                    <span className="text-purple-400/80 uppercase">
                                                        {(() => {
                                                            const r = fellow.tenures[fellow.tenures.length - 1]?.role;
                                                            return typeof r === 'object' ? r?.name : r || 'UNASSIGNED';
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            {/* Social Indicators */}
                                            <div className="flex gap-4 opacity-70">
                                                {fellow.socials?.github && (
                                                    <a href={ensureExternalLink(fellow.socials.github)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                        <Github className="w-4 h-4 text-white hover:text-purple-400 transition-colors" />
                                                    </a>
                                                )}
                                                {fellow.socials?.linkedin && (
                                                    <a href={ensureExternalLink(fellow.socials.linkedin)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                        <Linkedin className="w-4 h-4 text-white hover:text-purple-400 transition-colors" />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="px-4 py-1.5 border border-purple-500/30 text-purple-400 bg-purple-500/5 text-xs font-bold uppercase tracking-widest">
                                                {fellow.onboardingState}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {activeTab === 'orgs' && visibleOrgs.map((org, idx) => (
                                    <div
                                        key={org._id}
                                        onClick={() => { setSelectedItem(org); setOrgInspectorMember(null); router.replace(`${window.location.pathname}?orgCode=${org.code}`); }}
                                        className={`group px-8 py-6 border-b border-white/10 hover:bg-white/5 cursor-pointer flex items-center justify-between transition-all ${selectedItem?._id === org._id ? 'bg-green-900/10 border-l-[6px] border-l-green-500' : 'border-l-[6px] border-l-transparent'}`} 
                                    >
                                        <div className="flex items-center gap-8">
                                            <span className="text-sm font-mono text-gray-600 w-10">{String(idx + 1).padStart(2, '0')}</span>
                                            <div>
                                                <h3 className="font-bold text-2xl text-white group-hover:text-green-400 transition-colors uppercase tracking-tighter mb-2">{org.name}</h3>
                                                <div className="flex gap-4 text-xs font-mono text-gray-500 items-center">
                                                    <span className="text-green-500 border border-green-500/20 bg-green-500/5 px-2 py-0.5 rounded-none">{org.code}</span>
                                                    <span className="text-xs">{org.emailDomainWhitelist.length} DOMAINS</span>
                                                    <span className="text-xs">{(org.availableRoles || org.formVar1 || []).length} ROLES</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const rawRoles = org.availableRoles || org.formVar1 || [];
                                                    const availObjects = Array.isArray(rawRoles)
                                                        ? rawRoles.map(r => typeof r === 'string' ? { name: r, description: '' } : { name: r.name || '', description: r.description || '' })
                                                        : [];
                                                    setOrgData({
                                                        id: org._id,
                                                        name: org.name,
                                                        code: org.code,
                                                        emailDomainWhitelist: org.emailDomainWhitelist || [],
                                                        endDate: org.endDate || sixMonthsFromNow(),
                                                        defaultTenureEndDate: org.defaultTenureEndDate ? new Date(org.defaultTenureEndDate).getTime() : 0,
                                                        formVar1: availObjects.map(r => r.name),
                                                        availableRoles: availObjects,
                                                        isActive: org.isActive,
                                                        adminPassword: org.adminPassword || ''
                                                    });
                                                    setIsEditingOrg(true);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-green-500/10 border border-transparent hover:border-green-500/30 transition-all"
                                                title="Edit Organization"
                                            >
                                                <Settings className="w-4 h-4 text-green-500" />
                                            </button>
                                            <div className={`px-4 py-1.5 border text-xs font-bold uppercase tracking-widest ${org.isActive ? 'border-green-500/50 text-green-500' : 'border-red-500/50 text-red-500'}`}>
                                                {org.isActive ? 'ONLINE' : 'OFFLINE'}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {activeTab === 'projects' && projectData.filter(p => 
                                    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    p.description.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((project, idx) => (
                                    <div
                                        key={project._id}
                                        onClick={() => setSelectedItem(project)}
                                        className={`group px-8 py-6 border-b border-white/10 hover:bg-white/5 cursor-pointer flex items-center justify-between transition-all ${selectedItem?._id === project._id ? 'bg-orange-900/10 border-l-[6px] border-l-orange-500' : 'border-l-[6px] border-l-transparent'}`}
                                    >
                                        <div className="flex items-center gap-8">
                                            <span className="text-sm font-mono text-gray-600 w-10">{String(idx + 1).padStart(2, '0')}</span>
                                            <div>
                                                <h3 className="font-bold text-2xl text-white group-hover:text-orange-400 transition-colors uppercase tracking-tighter mb-2">{project.title}</h3>
                                                <div className="flex gap-4 text-xs font-mono text-gray-500 items-center">
                                                    <span className="text-orange-500 border border-orange-500/20 bg-orange-500/5 px-2 py-0.5 rounded-none flex items-center gap-1">
                                                        <Users className="w-3 h-3" /> {project.contributors?.length || 0}
                                                    </span>
                                                    <span className="text-xs flex items-center gap-1">
                                                        <ExternalLink className="w-3 h-3" /> {project.supportedLinks?.length || 0} LINKS
                                                    </span>
                                                    <span className="text-xs truncate max-w-[300px]">{project.description}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 border text-xs font-bold uppercase tracking-widest ${project.isActive ? 'border-orange-500/50 text-orange-500' : 'border-red-500/50 text-red-500'}`}>
                                            {project.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {/* Cyber Inspector Panel */}
                <AnimatePresence>
                    {selectedItem && (
                        <motion.aside
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'tween', ease: 'circOut', duration: 0.3 }}
                            className="w-[600px] bg-black border-l border-white/10 z-40 flex flex-col shrink-0 h-full min-h-0 shadow-[-50px_0_100px_rgba(0,0,0,0.8)]"
                        >
                            <div className="h-20 flex items-center justify-between px-10 border-b border-white/10 bg-black/50 backdrop-blur-md">
                                <h3 className="font-mono text-sm text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className={`w-2 h-2 ${activeTab === 'fellows' ? 'bg-purple-500' : activeTab === 'orgs' ? 'bg-green-500' : activeTab === 'projects' ? 'bg-orange-500' : 'bg-cyan-500'} animate-pulse`} />
                                    DATA_INSPECTOR
                                </h3>
                                <button onClick={() => { setSelectedItem(null); setOrgInspectorMember(null); }} className="hover:text-white text-gray-600 transition-colors"><XCircle className="w-6 h-6" /></button>
                            </div>

                            <div ref={inspectorRef} onScroll={saveInspectorScroll} className="flex-1 min-h-0 overflow-y-auto p-10 custom-scrollbar space-y-10">
                                {activeTab === 'orgs' ? renderOrgInspector() : activeTab === 'projects' ? (
                                    <>
                                        <div className="flex items-start gap-8 border-b border-white/10 pb-4">
                                            <div className="w-24 h-24 border border-orange-500/30 flex items-center justify-center text-4xl font-bold bg-orange-500/5 text-orange-500">
                                                <Code className="w-12 h-12" />
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <h2 className="text-3xl font-bold uppercase tracking-tight text-white">{selectedItem.title}</h2>
                                                <div className="text-xs font-mono text-gray-500 grid grid-cols-2 gap-3">
                                                    <span className="block p-2 border border-white/10">ID: {selectedItem._id}</span>
                                                    <span className="block p-2 border border-white/10">STATUS: {selectedItem.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                                                    <span className="block p-2 border border-white/10 col-span-2">CREATED: {new Date(selectedItem.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="p-8 border border-white/10 bg-white/[0.02] space-y-6">
                                                <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest border-b border-orange-900/30 pb-3">Project_Details</h4>
                                                
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <div className="text-[10px] text-gray-500 uppercase font-mono tracking-widest">Description</div>
                                                        <div className="p-4 bg-black/40 border border-white/5 text-xs text-gray-400 font-mono leading-relaxed">
                                                            {selectedItem.description || "NO_DESCRIPTION"}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="text-[10px] text-gray-500 uppercase font-mono tracking-widest">Contributors ({selectedItem.contributors?.length || 0})</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(selectedItem.contributors || []).map((contributor, idx) => (
                                                                <span key={idx} className="px-3 py-1.5 bg-orange-900/20 border border-orange-500/30 text-orange-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                                                                    <Users className="w-3 h-3" />
                                                                    {contributor.firstName} ({contributor.globalPid})
                                                                </span>
                                                            ))}
                                                            {(!selectedItem.contributors || selectedItem.contributors.length === 0) && (
                                                                <span className="px-2 py-1 border border-white/10 text-gray-600 text-[9px] uppercase">NO_CONTRIBUTORS</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="text-[10px] text-gray-500 uppercase font-mono tracking-widest">Links ({selectedItem.supportedLinks?.length || 0})</div>
                                                        <div className="space-y-2">
                                                            {(selectedItem.supportedLinks || []).map((link, idx) => (
                                                                <a
                                                                    key={idx}
                                                                    href={link.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center justify-between p-3 bg-black/40 border border-white/5 hover:border-orange-500/30 transition-all group"
                                                                >
                                                                    <span className="text-[10px] font-mono text-gray-400 uppercase">{link.linkName}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[9px] text-orange-500 font-mono truncate max-w-[200px]">{link.url}</span>
                                                                        <ExternalLink className="w-3 h-3 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                    </div>
                                                                </a>
                                                            ))}
                                                            {(!selectedItem.supportedLinks || selectedItem.supportedLinks.length === 0) && (
                                                                <span className="px-2 py-1 border border-white/10 text-gray-600 text-[9px] uppercase block">NO_LINKS_AVAILABLE</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-start gap-8 border-b border-white/10 pb-4">
                                            <div className={`w-24 h-24 border border-white/20 flex items-center justify-center text-4xl font-bold bg-white/5 ${activeTab === 'fellows' ? 'text-purple-500' : 'text-cyan-500'}`}>
                                                {selectedItem.firstName[0]}
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <h2 className="text-3xl font-bold uppercase tracking-tight text-white">{selectedItem.firstName} {selectedItem.lastName}</h2>
                                                <div className="text-xs font-mono text-gray-500 grid grid-cols-2 gap-3">
                                                    <span className="block p-2 border border-white/10">ID: {selectedItem.globalPid || 'NULL'}</span>
                                                    <span className="block p-2 border border-white/10">ORG: {selectedItem.orgCode}</span>
                                                    <span className="block p-2 border border-white/10 col-span-2">MAIL: {selectedItem.email}</span>
                                                </div>

                                            </div>
                                        </div>

                                        {activeTab === 'fellows' && (
                                            <div className="grid grid-cols-2 gap-6">
                                                <button
                                                    onClick={() => selectedItem.socials?.github ? window.open(ensureExternalLink(selectedItem.socials.github), '_blank') : toast.info("No GitHub link")}
                                                    className={`p-6 border border-white/10 hover:border-white hover:bg-white/5 transition-all flex flex-col items-center gap-3 ${!selectedItem.socials?.github && 'opacity-40 grayscale'}`}
                                                >
                                                    <Github className="w-6 h-6 text-gray-400" />
                                                    <span className="text-xs font-mono uppercase tracking-widest text-gray-500">GitHub_Uplink</span>
                                                </button>
                                                <button
                                                    onClick={() => selectedItem.socials?.linkedin ? window.open(ensureExternalLink(selectedItem.socials.linkedin), '_blank') : toast.info("No LinkedIn link")}
                                                    className={`p-6 border border-white/10 hover:border-white hover:bg-white/5 transition-all flex flex-col items-center gap-3 ${!selectedItem.socials?.linkedin && 'opacity-40 grayscale'}`}
                                                >
                                                    <Linkedin className="w-6 h-6 text-gray-400" />
                                                    <span className="text-xs font-mono uppercase tracking-widest text-gray-500">LinkedIn_Feed</span>
                                                </button>
                                            </div>
                                        )}

                                        {activeTab === 'applications' ? (
                                            <div className="space-y-8">
                                                <div className="p-8 border border-white/10 bg-white/[0.02] space-y-6">
                                                    <h4 className="text-xs font-bold text-cyan-500 uppercase tracking-widest border-b border-cyan-900/30 pb-3">Authorization_Protocol</h4>

                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <div className="text-[10px] text-gray-500 uppercase font-mono tracking-widest flex justify-between">
                                                                <span>Motivation_Payload</span>
                                                                <span className={( (selectedItem?.whyJoinDeepCytes ?? selectedItem?.data?.whyJoin ?? '').length < 100) ? "text-red-500" : "text-green-500"}>
                                                                    LEN_{(selectedItem?.whyJoinDeepCytes ?? selectedItem?.data?.whyJoin ?? '').length}
                                                                </span>
                                                            </div>
                                                            <div className="p-4 bg-black/40 border border-white/5 text-xs text-gray-400 font-mono leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                                                                {selectedItem.whyJoinDeepCytes || selectedItem.data?.whyJoin || "NO_DATA_FOUND"}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="text-[10px] text-gray-500 uppercase font-mono tracking-widest">Initial_Proposal</div>
                                                            <div className="p-4 bg-black/40 border border-white/5 text-xs text-gray-400 font-mono leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                                                                {selectedItem.data?.ideas || "NO_PROPOSAL_SUBMITTED"}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="text-[10px] text-gray-500 uppercase font-mono tracking-widest">Preferred_Specializations</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {(selectedItem.preferredRoles || []).length > 0 ? (
                                                                    selectedItem.preferredRoles.map((role, idx) => (
                                                                        <span key={idx} className="px-2 py-1 bg-cyan-900/30 border border-cyan-500/30 text-cyan-400 text-[9px] font-bold uppercase tracking-wider">
                                                                            {typeof role === 'object' ? role?.name : role}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="px-2 py-1 border border-white/10 text-gray-600 text-[9px] uppercase">LEGACY_ROLE: {typeof selectedItem.role === 'object' ? selectedItem.role?.name : selectedItem.role}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {selectedItem.processedBy && (
                                                        <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-2">
                                                            <span className="uppercase">Authenticated_By:</span>
                                                            <span className="text-cyan-500">{selectedItem.processedBy}</span>
                                                        </div>
                                                    )}

                                                    {(selectedItem.status === 'PENDING' || selectedItem.status === 'INTERVIEW_SCHEDULED' || selectedItem.status === 'INTERVIEW_SKIPPED') && (
                                                        <div className="space-y-3">
                                                            <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Interview Protocol</label>

                                                            {/* Show Schedule Button for PENDING */}
                                                            {selectedItem.status === 'PENDING' && (!selectedItem.interviewDetails || selectedItem.interviewDetails.status === 'PENDING') ? (
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <button
                                                                        onClick={() => setShowScheduleModal(true)}
                                                                        className="h-10 border border-cyan-500/50 text-cyan-400 bg-cyan-900/10 hover:bg-cyan-500/20 text-xs font-bold uppercase tracking-wider"
                                                                    >
                                                                        Schedule Interview
                                                                    </button>
                                                                    <button
                                                                        onClick={handleSkipInterview}
                                                                        className="h-10 border border-gray-600/50 text-gray-500 hover:text-white hover:border-white/50 text-xs font-bold uppercase tracking-wider"
                                                                    >
                                                                        Skip Protocol
                                                                    </button>
                                                                </div>
                                                            ) : selectedItem.status === 'INTERVIEW_SCHEDULED' ? (
                                                                <div className="space-y-3">
                                                                    {/* Current Interview Details */}
                                                                    <div className="p-4 bg-orange-900/10 border border-orange-500/30 space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-[10px] font-mono text-orange-400 uppercase">Scheduled_Time:</span>
                                                                            <span className="text-xs font-mono text-white">
                                                                                {selectedItem.interviewDetails?.scheduledAt
                                                                                    ? new Date(selectedItem.interviewDetails.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                                                                                    : 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-[10px] font-mono text-orange-400 uppercase">Meet_Link:</span>
                                                                            <a
                                                                                href={selectedItem.interviewDetails?.meetLink?.startsWith('http') ? selectedItem.interviewDetails.meetLink : `https://${selectedItem.interviewDetails?.meetLink}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-xs font-mono text-cyan-400 hover:underline truncate max-w-[200px]"
                                                                            >
                                                                                {selectedItem.interviewDetails?.meetLink || 'N/A'}
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                    {/* Reschedule + No-show Buttons */}
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <button
                                                                            onClick={() => {
                                                                                setScheduleData({
                                                                                    scheduledAt: selectedItem.interviewDetails?.scheduledAt ? new Date(selectedItem.interviewDetails.scheduledAt).toISOString().slice(0, 16) : '',
                                                                                    meetLink: selectedItem.interviewDetails?.meetLink || ''
                                                                                });
                                                                                setShowScheduleModal(true);
                                                                            }}
                                                                            className="w-full h-10 border border-orange-500/50 text-orange-400 bg-orange-900/10 hover:bg-orange-500/20 text-xs font-bold uppercase tracking-wider"
                                                                        >
                                                                            Reschedule Interview
                                                                        </button>
                                                                        <button onClick={handleMarkNoShow} className="w-full h-10 border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider">Mark No-show</button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="p-3 bg-cyan-900/10 border border-cyan-500/30 text-xs font-mono text-cyan-400">
                                                                    STATUS: {selectedItem.interviewDetails?.status || selectedItem.status}
                                                                </div>
                                                            )}

                                                            {/* Schedule Modal */}
                                                            {showScheduleModal && (
                                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border border-cyan-500/30 bg-black p-4 space-y-4">
                                                                    <h5 className="text-xs font-bold text-cyan-500 uppercase">Input_Coordinates</h5>
                                                                    <Input
                                                                        type="datetime-local"
                                                                        value={scheduleData.scheduledAt}
                                                                        onChange={e => setScheduleData({ ...scheduleData, scheduledAt: e.target.value })}
                                                                        className="bg-black border-white/20 h-10 text-xs font-mono text-white"
                                                                    />
                                                                    <Input
                                                                        placeholder="GMEET_UPLINK_URL"
                                                                        value={scheduleData.meetLink}
                                                                        onChange={e => setScheduleData({ ...scheduleData, meetLink: e.target.value })}
                                                                        className="bg-black border-white/20 h-10 text-xs font-mono text-white"
                                                                    />
                                                                    <div className="flex gap-2">
                                                                        <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-2 border border-red-500/50 text-red-500 hover:bg-red-500/10 text-[10px] font-bold uppercase">ABORT</button>
                                                                        <button onClick={handleScheduleInterview} className="flex-1 py-2 bg-cyan-600 text-black font-bold text-[10px] uppercase hover:bg-cyan-500">CONFIRM</button>
                                                                    </div>
                                                                </motion.div>
                                                            )}

                                                            {showAssignRoleModal && (
                                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border border-yellow-500/30 bg-black p-4 space-y-4">
                                                                    <h5 className="text-xs font-bold text-yellow-400 uppercase">Assign Role (required before Accept)</h5>
                                                                    <div className="text-xs text-gray-400">Choose one of: Applied role, Organization roles, or Global roles</div>
                                                                    <div>
                                                                        <select value={skipAssignedRole} onChange={e => setSkipAssignedRole(e.target.value)} className="w-full bg-black border border-white/20 h-10 text-xs font-mono text-white px-2">
                                                                            {(() => {
                                                                                const t = skipModalTarget || {};
                                                                                const defaultRole = t.role ? (typeof t.role === 'string' ? t.role : (t.role.name || '')) : (Array.isArray(t.preferredRoles) && t.preferredRoles.length ? (typeof t.preferredRoles[0] === 'string' ? t.preferredRoles[0] : (t.preferredRoles[0]?.name || '')) : '');
                                                                                const orgObj = (t.orgCode && Array.isArray(orgs) ? orgs.find(o => o.code === t.orgCode) : null) || (t.code && Array.isArray(orgs) ? orgs.find(o => o.code === t.code) : null);
                                                                                const orgRoles = orgObj ? (orgObj.formVars?.roles ? orgObj.formVars.roles.map(r => r.name) : (Array.isArray(orgObj.formVar1) ? orgObj.formVar1 : [])) : [];
                                                                                const globalRoles = (availableRoles || []).map(r => (typeof r === 'string' ? r : (r.name || ''))).filter(Boolean);

                                                                                return (
                                                                                    <>
                                                                                        <optgroup label="Applied Role">
                                                                                            <option value={defaultRole}>{defaultRole || '—'}</option>
                                                                                        </optgroup>
                                                                                        <optgroup label="Organization Roles">
                                                                                            {orgRoles.length ? orgRoles.map((r, i) => <option key={`org-${i}`} value={r}>{r}</option>) : <option value="">-- none --</option>}
                                                                                        </optgroup>
                                                                                        <optgroup label="Global Roles">
                                                                                            {globalRoles.length ? globalRoles.map((r, i) => <option key={`glob-${i}`} value={r}>{r}</option>) : <option value="">-- none --</option>}
                                                                                        </optgroup>
                                                                                    </>
                                                                                );
                                                                            })()}
                                                                        </select>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button onClick={() => { setShowAssignRoleModal(false); setSkipModalTarget(null); }} className="flex-1 py-2 border border-red-500/50 text-red-500 hover:bg-red-500/10 text-[10px] font-bold uppercase">CANCEL</button>
                                                                        <button onClick={confirmSkipInterview} className="flex-1 py-2 bg-yellow-400 text-black font-bold text-[10px] uppercase hover:bg-yellow-300">CONFIRM SKIP</button>
                                                                    </div>
                                                                </motion.div>
                                                            )}

                                                            <div className="h-px bg-white/10 my-4" />

                                                            {/* <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Tenure Termination Code</label>
                                                            <Input
                                                                placeholder="DDMMYYYY"
                                                                value={tenureEndDate}
                                                                onChange={e => setTenureEndDate(e.target.value)}
                                                                className="bg-black border-white/20 h-12 font-mono text-center text-lg tracking-[0.3em] text-cyan-400 focus:border-cyan-500"
                                                            /> */}
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 gap-6 pt-4">
                                                        <button onClick={() => handleUpdateAppStatus('REJECTED')} className="h-14 border border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500 transition-all text-sm font-bold uppercase tracking-[0.2em]">
                                                            REJECT
                                                        </button>
                                                    {selectedItem.status !== 'REJECTED' && (
                                                        <button
                                                            onClick={() => handleUpdateAppStatus('ACCEPTED')}
                                                            disabled={
                                                                (selectedItem.status === 'PENDING' && (!selectedItem.interviewDetails?.status || selectedItem.interviewDetails?.status === 'PENDING') && selectedItem.status !== 'INTERVIEW_SKIPPED')
                                                                || !(selectedItem.assignedRole && String(selectedItem.assignedRole).trim())
                                                            }
                                                            className={`h-14 border transition-all text-sm font-bold uppercase tracking-[0.2em] ${((selectedItem.status === 'PENDING' && (!selectedItem.interviewDetails?.status || selectedItem.interviewDetails?.status === 'PENDING') && selectedItem.status !== 'INTERVIEW_SKIPPED') || !(selectedItem.assignedRole && String(selectedItem.assignedRole).trim())) ? 'border-gray-800 text-gray-700 cursor-not-allowed bg-transparent' : 'bg-cyan-700/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black'}`}
                                                        >
                                                            ACCEPT
                                                        </button>
                                                    )}
                                                    </div>
                                                </div>

                                                {(selectedItem.resume || selectedItem.data?.resumeLink) && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {selectedItem.resume && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); const serverUrl = process.env.SERVER_URL || 'http://localhost:3001'; const url = selectedItem.resume.startsWith('http') ? selectedItem.resume : `${serverUrl}${selectedItem.resume}`; window.open(url, '_blank'); }}
                                                                className="w-full py-4 border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-3 group rounded-lg"
                                                            >
                                                                <FileText className="w-5 h-5" />
                                                                <span className="text-sm font-mono font-bold uppercase tracking-[0.08em]">Open uploaded CV</span>
                                                                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </button>
                                                        )}

                                                        {selectedItem.data?.resumeLink && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); window.open(ensureExternalLink(selectedItem.data.resumeLink), '_blank'); }}
                                                                className="w-full py-4 border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-3 group rounded-lg"
                                                            >
                                                                <ExternalLink className="w-5 h-5" />
                                                                <span className="text-sm font-mono font-bold uppercase tracking-[0.08em]">Open resume link</span>
                                                                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-10">
                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 flex justify-between items-center">
                                                        <span>Career Trajectory</span>
                                                        <button onClick={() => setShowPromoteModal(!showPromoteModal)} className="text-purple-400 hover:text-white transition-colors flex items-center gap-2 text-xs">
                                                            <ArrowUpCircle className="w-4 h-4" /> PROMOTION_PROTOCOL
                                                        </button>
                                                        <button onClick={() => setShowTerminateModal(!showTerminateModal)} className="text-red-500 hover:text-red-400 transition-colors flex items-center gap-2 text-xs ml-4">
                                                            <XCircle className="w-4 h-4" /> TERMINATION_PROTOCOL
                                                        </button>
                                                    </h4>

                                                    {showTerminateModal && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-8 border border-red-500/30 bg-red-900/10 p-6 space-y-4 overflow-hidden">
                                                            <h5 className="text-xs font-bold text-red-500 uppercase">Confirm_Termination</h5>
                                                            <Input
                                                                placeholder="Reason for Termination"
                                                                value={terminationData.reason}
                                                                onChange={e => setTerminationData({ ...terminationData, reason: e.target.value })}
                                                                className="bg-black border-red-500/20 h-10 text-xs font-mono"
                                                            />
                                                            <Input
                                                                type="date"
                                                                placeholder="End Date"
                                                                value={terminationData.endDate}
                                                                onChange={e => setTerminationData({ ...terminationData, endDate: e.target.value })}
                                                                className="bg-black border-red-500/20 h-10 text-xs font-mono uppercase"
                                                            />
                                                            <button onClick={handleTerminateFellow} className="w-full py-3 bg-red-600 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-red-500 border border-red-400">
                                                                EXECUTE TERMINATION
                                                            </button>
                                                        </motion.div>
                                                    )}

                                                    {showPromoteModal && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-8 border border-purple-500/30 bg-purple-900/10 p-6 space-y-4 overflow-hidden">
                                                            <Input placeholder="NEW_ROLE_TITLE" value={promotionData.newRole} onChange={e => setPromotionData({ ...promotionData, newRole: e.target.value })} className="bg-black border-purple-500/20 h-10 text-xs font-mono uppercase" />
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <Input placeholder="COHORT_ID" value={promotionData.newCohort} onChange={e => setPromotionData({ ...promotionData, newCohort: e.target.value })} className="bg-black border-purple-500/20 h-10 text-xs font-mono uppercase" />
                                                                <Input placeholder="STATUS_MARKER" value={promotionData.newStatus} onChange={e => setPromotionData({ ...promotionData, newStatus: e.target.value })} className="bg-black border-purple-500/20 h-10 text-xs font-mono uppercase" />
                                                            </div>
                                                            <button onClick={handlePromoteFellow} className="w-full py-3 bg-purple-600 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-purple-500 border border-purple-400">EXECUTE PROMOTION</button>
                                                        </motion.div>
                                                    )}

                                                    <TenureTimeline tenures={selectedItem.tenures || []} />

                                                    {/* Signed Documents Inspector */}
                                                    <div className="pt-6 border-t border-white/10 mt-6">
                                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Encrypted_Assets</h4>
                                                        <div className="space-y-4">
                                                            {(selectedItem.tenures || []).map((tenure, idx) => (
                                                                <div key={idx} className="space-y-2">
                                                                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                                                                        <span>TENURE_{idx + 1}: {typeof tenure.role === 'object' ? tenure.role?.name : tenure.role}</span>
                                                                        <span>{tenure.status}</span>
                                                                    </div>
                                                                    <div className="grid gap-2">
                                                                        {['nda', 'offerLetter', 'completionLetter'].map(docType => {
                                                                            const doc = tenure.signedDocuments?.[docType];
                                                                            if (!doc || !doc.signedAt) return null;
                                                                            return (
                                                                                <button
                                                                                    key={docType}
                                                                                    onClick={() => handleAdminDownload(selectedItem._id, idx, docType, `${docType}_${selectedItem.lastName}.pdf`)}
                                                                                    className="w-full flex items-center justify-between p-3 border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-cyan-500/30 transition-all group text-left"
                                                                                >
                                                                                    <div className="flex items-center gap-3">
                                                                                        <FileText className="w-4 h-4 text-cyan-500" />
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-xs text-white font-mono uppercase">{docType}</span>
                                                                                            <span className="text-[9px] text-gray-500 font-mono">{new Date(doc.signedAt).toLocaleDateString()}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <Download className="w-3 h-3 text-gray-500 group-hover:text-cyan-400" />
                                                                                </button>
                                                                            );
                                                                        })}
                                                                        {(!tenure.signedDocuments || Object.values(tenure.signedDocuments).filter(d => d && d.signedAt).length === 0) && (
                                                                            <span className="text-[10px] italic text-gray-700 pl-2">NO ASSETS FOUND</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-10 border-t border-white/10">
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Lifecycle Overrides</h4>
                                                    <div className="grid grid-cols-2 gap-2.5">
                                                        {['PROFILE', 'NDA', 'OFFER', 'RESOURCES', 'RESEARCH', 'FEEDBACK', 'COMPLETION'].map(s => (
                                                            <button
                                                                key={s}
                                                                onClick={() => handleUpdateState(s)}
                                                                className={`py-2.5 px-4 border text-[10px] font-mono text-left transition-all hover:bg-white hover:text-black ${selectedItem.onboardingState === s ? 'border-purple-500 text-purple-400 bg-purple-900/10' : 'border-white/10 text-gray-500'}`}
                                                            >
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
                {/* Add/Edit Organization Modal */}
                <AnimatePresence>
                    {isEditingOrg && (
                        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-6 sm:py-0">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-[98vw] sm:max-w-[720px] md:max-w-[980px] lg:max-w-[1100px] bg-black border border-white/20 shadow-[0_0_50px_rgba(4,120,87,0.2)] p-0 max-h-[95vh] sm:max-h-[90vh] md:max-h-[80vh] flex flex-col overflow-y-auto rounded-none sm:rounded-2xl"
                                style={{ margin: 'env(safe-area-inset-top, 0) auto env(safe-area-inset-bottom, 0) auto' }}
                            >
                                <div className="h-12 sm:h-14 flex items-center justify-between px-4 sm:px-6 border-b border-white/10 bg-white/5 shrink-0 sticky top-0 z-20">
                                    <h3 className="text-sm font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                                        <Database className="w-4 h-4" /> FELLOWSHIP_NODE_CONFIGURATION
                                    </h3>
                                    <button onClick={() => setIsEditingOrg(false)} className="text-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-500"><XCircle className="w-5 h-5" /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-6 space-y-3 md:space-y-4">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase font-mono text-gray-500">Node_Name</label>
                                                <Input value={orgData.name} onChange={e => setOrgData({ ...orgData, name: e.target.value })} className="bg-black border-white/20 h-10 text-xs font-mono text-white focus:border-green-500" placeholder="ENTER_NAME" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase font-mono text-gray-500">Access_Code</label>
                                                <Input value={orgData.code} onChange={e => setOrgData({ ...orgData, code: e.target.value.toUpperCase() })} className="bg-black border-white/20 h-10 text-xs font-mono text-green-500 focus:border-green-500" placeholder="UNIQUE_CODE" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase font-mono text-gray-500">Node_Login_Pass</label>
                                                <Input value={orgData.adminPassword} onChange={e => setOrgData({ ...orgData, adminPassword: e.target.value })} className="bg-black border-white/20 h-10 text-xs font-mono text-green-500 focus:border-green-500" placeholder="LOGIN_PASS" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-mono text-gray-500">Domain_Whitelist (Comma Separated)</label>
                                            <Input
                                                value={orgData.emailDomainWhitelist?.join(', ')}
                                                onChange={e => setOrgData({ ...orgData, emailDomainWhitelist: e.target.value.split(',').map(s => s.trim()) })}
                                                className="bg-black border-white/20 h-10 text-xs font-mono text-gray-300 focus:border-green-500"
                                                placeholder="example.com, org.io"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-mono text-gray-500">Available_Roles (Select Multiple)</label>
                                            <div className="text-[10px] text-gray-500 mt-1">Global roles are available across the app — use <span className="font-bold uppercase">ADD (GLOBAL)</span> to add a role globally or <span className="font-bold uppercase">ADD TO ORG (LOCAL)</span> to attach it only to this organization.</div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3 p-3 bg-white/5 border border-white/10 max-h-36 sm:max-h-32 overflow-y-auto">
                                                {([...(availableRoles || []).map(r => (typeof r === 'string' ? r : r.name)), ...(orgData.availableRoles || []).map(r => r.name)]).filter((v,i,a) => a.indexOf(v) === i).map(role => {
                                                    const roleObj = (orgData.availableRoles || []).find(r => r.name === role);
                                                    const isEditing = editingRoleDesc === role;
                                                    return (
                                                        <label key={role} className={`group cursor-pointer p-2 transition-colors rounded ${isEditing ? 'bg-white/3' : 'hover:bg-white/5'}`}>
                                                            <div className="flex items-center gap-2 w-full">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={(orgData.formVar1 || []).includes(role)}
                                                                    onChange={(e) => {
                                                                        const current = orgData.formVar1 || [];
                                                                        const updated = e.target.checked
                                                                            ? [...current, role]
                                                                            : current.filter(r => r !== role);
                                                                        setOrgData({ ...orgData, formVar1: updated });
                                                                    }}
                                                                    className="w-3 h-3 accent-green-500"
                                                                />

                                                                <span className="text-[10px] text-gray-300 group-hover:text-white truncate">{role}</span>

                                                                <div className="flex-1" />

                                                                {/* edit button for roles that belong to this org */}
                                                                {roleObj && !isEditing && (
                                                                    <button type="button" onClick={(e) => { e.stopPropagation(); startEditRoleDesc(role); }} className="ml-2 text-[10px] text-cyan-400 hover:text-white">Edit</button>
                                                                )}

                                                                {/* compact split-menu: trash icon opens menu with Local/Global remove */}
                                                                <div className="relative ml-2">
                                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setRoleMenuOpenFor(roleMenuOpenFor === role ? null : role); }} className="p-1 rounded bg-white/5 hover:bg-white/10">
                                                                        <Trash className="w-3 h-3 text-red-400" />
                                                                    </button>

                                                                    {roleMenuOpenFor === role && (
                                                                        <div className="absolute right-0 mt-2 w-44 bg-black border border-white/10 rounded shadow-lg z-50 py-1">
                                                                            {roleObj && <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ mode: 'LOCAL', roleName: role, roleObj }); setRoleMenuOpenFor(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5">Remove (local)</button>}
                                                                            {(availableRoles || []).find(ar => (typeof ar === 'string' ? ar : ar.name) === role) && (() => { const g = (availableRoles || []).find(ar => (typeof ar === 'string' ? ar : ar.name) === role); return (<button type="button" onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ mode: 'GLOBAL', roleName: role, roleObj: g }); setRoleMenuOpenFor(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5">Remove (global)</button>); })()}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                            </div>

                                                            {/* show description (below the role) */}
                                                            {roleObj && roleObj.description && !isEditing && (
                                                                <div className="text-[10px] text-gray-500 ml-3 pl-1 break-words">{roleObj.description}</div>
                                                            )}

                                                            {/* inline edit controls (stacked under the role) */}
                                                            {isEditing && (
                                                                <div className="w-full ml-3 flex gap-2 mt-2">
                                                                    <input value={editingRoleTempDesc} onChange={e => setEditingRoleTempDesc(e.target.value)} placeholder="description (optional)" className="flex-1 bg-black border border-white/10 text-xs px-2 py-1 h-8" />
                                                                    <button onClick={(e) => { e.stopPropagation(); saveRoleDescEdit(); }} className="text-xs bg-green-700/20 px-2 py-1 rounded">Save</button>
                                                                    <button onClick={(e) => { e.stopPropagation(); cancelRoleDescEdit(); }} className="text-xs bg-red-700/10 px-2 py-1 rounded">Cancel</button>
                                                                </div>
                                                            )}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                            {/* Add custom role input */}
                                            <div className="flex gap-2 mt-3">
                                                <Input
                                                    value={newRole}
                                                    onChange={(e) => setNewRole(e.target.value)}
                                                    onKeyPress={(e) => { if (e.key === 'Enter') handleAddRole(); }}
                                                    placeholder="Add new role (global)"
                                                    className="bg-black border-white/20 h-8 text-xs font-mono text-white focus:border-green-500 w-24"
                                                />
                                                <Input
                                                    value={newRoleDescription}
                                                    onChange={(e) => setNewRoleDescription(e.target.value)}
                                                    placeholder="description (optional)"
                                                    className="bg-black border-white/20 h-8 text-xs font-mono text-white focus:border-green-500 flex-1"
                                                />
                                                <button
                                                    onClick={handleAddRole}
                                                    title="Add role to global list — available across all organizations"
                                                    className="px-3 h-8 bg-green-900/20 border border-green-500/50 text-green-500 hover:bg-green-500/10 text-[10px] font-bold uppercase tracking-wider transition-colors"
                                                >
                                                    ADD (GLOBAL)
                                                </button>
                                            </div>

                                            {/* Add role directly to this org (local) */}
                                            <div className="flex gap-2 mt-3">
                                                <Input
                                                    value={newOrgRole}
                                                    onChange={(e) => setNewOrgRole(e.target.value)}
                                                    onKeyPress={(e) => { if (e.key === 'Enter') handleAddOrgRole(); }}
                                                    placeholder="Add role to this org (local)"
                                                    className="bg-black border-white/20 h-8 text-xs font-mono text-white focus:border-green-500 w-24"
                                                />
                                                <Input
                                                    value={newOrgRoleDescription}
                                                    onChange={(e) => setNewOrgRoleDescription(e.target.value)}
                                                    placeholder="description (org-local, optional)"
                                                    className="bg-black border-white/20 h-8 text-xs font-mono text-white focus:border-green-500 flex-1"
                                                />
                                                <button
                                                    onClick={handleAddOrgRole}
                                                    title="Add role only to this organization (local)"
                                                    className="px-3 h-8 bg-cyan-900/10 border border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10 text-[10px] font-bold uppercase tracking-wider transition-colors"
                                                >
                                                    ADD TO ORG (LOCAL)
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase font-mono text-gray-500">End Of Application Date</label>
                                                <Input
                                                    type="date"
                                                    value={orgData.endDate ? new Date(orgData.endDate).toISOString().split('T')[0] : ''}
                                                    onChange={e => setOrgData({ ...orgData, endDate: new Date(e.target.value).getTime() })}
                                                    className="bg-black border-white/20 h-10 text-xs font-mono text-gray-300 focus:border-green-500"
                                                />

                                                <label className="text-[10px] uppercase font-mono text-gray-500 mt-3">Tenure End Date</label>
                                                <Input
                                                    type="date"
                                                    value={orgData.defaultTenureEndDate ? new Date(orgData.defaultTenureEndDate).toISOString().split('T')[0] : ''}
                                                    onChange={e => setOrgData({ ...orgData, defaultTenureEndDate: e.target.value ? new Date(e.target.value).getTime() : 0 })}
                                                    className="bg-black border-white/20 h-10 text-xs font-mono text-gray-300 focus:border-green-500"
                                                />
                                            </div>
                                            <div className="flex items-end pb-3">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-4 h-4 border transition-colors ${orgData.isActive ? 'bg-green-500 border-green-500' : 'border-gray-500 group-hover:border-green-500'}`}>
                                                        {orgData.isActive && <CheckCircle className="w-3.5 h-3.5 text-black" />}
                                                    </div>
                                                    <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-green-400">Node_Online</span>
                                                    <input type="checkbox" className="hidden" checked={orgData.isActive} onChange={e => setOrgData({ ...orgData, isActive: e.target.checked })} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <button
                                            onClick={handleSaveOrg}
                                            disabled={actionLoading}
                                            className="w-full h-10 sm:h-12 bg-green-900/20 border border-green-500/50 text-green-500 hover:bg-green-500 hover:text-black font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 text-sm"
                                        >
                                            {actionLoading ? 'UPLOADING...' : (orgData.id ? 'UPDATE_NODE' : 'INITIALIZE_NODE')}
                                        </button>

                                        {orgData?.id && (
                                            <button
                                                onClick={handleArchiveOrg}
                                                disabled={actionLoading}
                                                className="w-full h-10 bg-red-900/10 border border-red-500/40 text-red-400 hover:bg-red-500/10 text-[10px] font-bold uppercase tracking-wider transition-colors"
                                            >
                                                ARCHIVE NODE
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Confirm Delete Modal (global / local) */}
                <AnimatePresence>
                    {deleteConfirm && (
                        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70">
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="w-full max-w-md bg-black border border-white/10 p-6 rounded-2xl shadow-lg">
                                <h4 className="text-sm font-bold text-white mb-2">Confirm removal</h4>
                                <p className="text-xs text-gray-400">Are you sure you want to remove <span className="font-bold">{deleteConfirm.roleName}</span> {deleteConfirm.mode === 'GLOBAL' ? 'globally (it will be hidden across the app)' : `from ${orgData.code || 'this org'}`}?</p>
                                <div className="flex gap-2 mt-4">
                                    {deleteConfirm.mode === 'GLOBAL' ? (
                                        <>
                                            <button onClick={async () => {
                                                setDeleteConfirm(null);
                                                await handleDeleteRole(deleteConfirm.roleObj, true);
                                            }} className="flex-1 py-2 bg-red-600 text-white text-xs font-bold uppercase hover:bg-red-500">Deactivate (soft)</button>

                                            <button onClick={async () => {
                                                setDeleteConfirm(null);
                                                await handlePermanentDeleteRole(deleteConfirm.roleObj);
                                            }} className="flex-1 py-2 bg-red-800 text-white text-xs font-bold uppercase hover:bg-red-700">Permanent Delete (clean refs)</button>
                                        </>
                                    ) : (
                                        <button onClick={async () => { setDeleteConfirm(null); await handleDeleteOrgRole(deleteConfirm.roleName, true); }} className="flex-1 py-2 bg-red-600 text-white text-xs font-bold uppercase hover:bg-red-500">Confirm</button>
                                    )}

                                    <button onClick={() => setDeleteConfirm(null)} className="w-28 py-2 border border-white/10 text-xs font-bold uppercase">Cancel</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Manual Onboarding Modal */}
                <AnimatePresence>
                    {showManualModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-[600px] bg-black border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.1)] rounded-2xl overflow-hidden"
                            >
                                <div className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-purple-500/5">
                                    <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                        <Plus className="w-4 h-4" /> MANUAL TENURE PROVISIONING
                                    </h3>
                                    <button onClick={() => setShowManualModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-1.5 col-span-2">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Personnel Email</label>
                                            <Input value={manualFellowData.email} onChange={e => setManualFellowData({ ...manualFellowData, email: e.target.value.toLowerCase() })} className="bg-black border-white/10 h-10 text-xs font-mono text-white focus:border-purple-500" placeholder="IDENTIFIER@DEEPCYTES.IO" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">First Name</label>
                                            <Input value={manualFellowData.firstName} onChange={e => setManualFellowData({ ...manualFellowData, firstName: e.target.value })} className="bg-black border-white/10 h-10 text-xs font-mono text-white focus:border-purple-500" placeholder="NAME_ENTRY" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Last Name</label>
                                            <Input value={manualFellowData.lastName} onChange={e => setManualFellowData({ ...manualFellowData, lastName: e.target.value })} className="bg-black border-white/10 h-10 text-xs font-mono text-white focus:border-purple-500" placeholder="SURNAME_ENTRY" />
                                        </div>

                                        <div className="space-y-1.5 pt-2 border-t border-white/5 col-span-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] uppercase font-bold text-purple-500 tracking-widest">Designated_Role</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="NEW_ROLE (global)..."
                                                        className="bg-black border-b border-white/20 text-[10px] w-24 outline-none focus:border-purple-500 px-1 text-white"
                                                        value={newRole}
                                                        onChange={e => setNewRole(e.target.value)}
                                                        onKeyPress={e => e.key === 'Enter' && handleAddRole()}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="desc (global, optional)"
                                                        className="bg-black border-b border-white/20 text-[10px] w-56 outline-none focus:border-purple-500 px-1 text-white"
                                                        value={newRoleDescription}
                                                        onChange={e => setNewRoleDescription(e.target.value)}
                                                    />
                                                    <button title="Add role to global list — available across all organizations" onClick={handleAddRole} className="text-[10px] text-purple-400 hover:text-white uppercase font-bold">Add (global)</button>
                                                </div>
                                            </div>
                                            <select
                                                value={manualFellowData.role}
                                                onChange={e => setManualFellowData({ ...manualFellowData, role: e.target.value })}
                                                className="w-full bg-black border border-white/10 h-10 text-xs font-mono text-white focus:border-purple-500 outline-none px-3"
                                            >
                                                <option value="">SELECT_ROLE</option>
                                                {availableRoles.map(r => {
                                                        const name = typeof r === 'string' ? r : r.name;
                                                        return <option key={name} value={name}>{name}</option>;
                                                    })}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5 pt-2 border-t border-white/5 col-span-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] uppercase font-bold text-green-500 tracking-widest">Assigned Node Code</label>
                                                <button
                                                    onClick={() => {
                                                        const name = prompt("Enter Node Name:");
                                                        const code = prompt("Enter Node Code:");
                                                        const password = prompt("Enter Password For Node Login")
                                                        if (name && code && password) handleQuickAddOrg(name, code, password);
                                                    }}
                                                    className="text-[10px] text-green-400 hover:text-white uppercase font-bold"
                                                >
                                                    + Quick_Initialize
                                                </button>
                                            </div>
                                            <select
                                                value={manualFellowData.orgCode}
                                                onChange={e => setManualFellowData({ ...manualFellowData, orgCode: e.target.value })}
                                                className="w-full bg-black border border-white/10 h-10 text-xs font-mono text-white focus:border-green-500 outline-none px-3"
                                            >
                                                <option value="">NO_NODE_ASSIGNED (OPTIONAL)</option>
                                                {orgs.map(o => <option key={o.code} value={o.code}>{o.code} - {o.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Tenure Sequence</label>
                                            <Input
                                                value={manualFellowData.cohort}
                                                onChange={e => setManualFellowData({ ...manualFellowData, cohort: e.target.value })}
                                                className="bg-black border-white/10 h-10 text-xs font-mono text-white focus:border-purple-500"
                                                placeholder="B1, B2 (OR #)"
                                            />
                                        </div>
                                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Onboarding Date</label>
                                            <Input type="date" value={manualFellowData.startDate} onChange={e => setManualFellowData({ ...manualFellowData, startDate: e.target.value })} className="bg-black border-white/10 h-10 text-xs font-mono text-white focus:border-purple-500" />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAddManualFellow}
                                        disabled={actionLoading}
                                        className="w-full h-12 bg-purple-900/20 border border-purple-500/50 text-purple-500 hover:bg-purple-500 hover:text-black font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 text-xs mt-4"
                                    >
                                        {actionLoading ? 'COMMITTING...' : 'INITIALIZE_TENURE'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Create Project Modal */}
                <AnimatePresence>
                    {showCreateProjectModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-[700px] bg-black border border-orange-500/30 shadow-[0_0_50px_rgba(249,115,22,0.1)] rounded-2xl overflow-hidden"
                            >
                                <div className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-orange-500/5">
                                    <h3 className="text-sm font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                                        <Code className="w-4 h-4" /> CREATE NEW PROJECT
                                    </h3>
                                    <button onClick={() => setShowCreateProjectModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                    {/* Basic Info */}
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Project Title *</label>
                                            <Input 
                                                value={newProjectData.title} 
                                                onChange={e => setNewProjectData({ ...newProjectData, title: e.target.value })} 
                                                className="bg-black border-white/10 h-10 text-xs font-mono text-white focus:border-orange-500" 
                                                placeholder="PROJECT_NAME"
                                            />
                                        </div>
                                        
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Description *</label>
                                            <textarea 
                                                value={newProjectData.description} 
                                                onChange={e => setNewProjectData({ ...newProjectData, description: e.target.value })} 
                                                className="w-full bg-black border border-white/10 p-3 text-xs font-mono text-white focus:border-orange-500 outline-none min-h-[80px] custom-scrollbar"
                                                placeholder="PROJECT_DESCRIPTION..."
                                            />
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="checkbox" 
                                                id="isActive"
                                                checked={newProjectData.isActive}
                                                onChange={e => setNewProjectData({ ...newProjectData, isActive: e.target.checked })}
                                                className="w-4 h-4 accent-orange-500"
                                            />
                                            <label htmlFor="isActive" className="text-xs text-gray-400 cursor-pointer">ACTIVE_PROJECT</label>
                                        </div>
                                    </div>

                                    {/* Links Section */}
                                    <div className="pt-4 border-t border-white/5 space-y-3">
                                        <label className="text-[10px] uppercase font-bold text-orange-500 tracking-widest">Supported Links</label>
                                        
                                        {/* Added Links */}
                                        {newProjectData.supportedLinks.length > 0 && (
                                            <div className="space-y-2 mb-3">
                                                {newProjectData.supportedLinks.map((link, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 p-2 bg-orange-900/10 border border-orange-500/20">
                                                        <ExternalLink className="w-3 h-3 text-orange-500" />
                                                        <div className="flex-1 text-[10px] font-mono">
                                                            <div className="text-orange-400">{link.linkName}</div>
                                                            <div className="text-gray-500 truncate">{link.url}</div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleRemoveLink(idx)}
                                                            className="text-red-500 hover:text-red-400 p-1"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add Link Form */}
                                        <div className="flex gap-2">
                                            <Input 
                                                value={newLink.linkName} 
                                                onChange={e => setNewLink({ ...newLink, linkName: e.target.value })} 
                                                className="bg-black border-white/10 h-9 text-xs font-mono text-white focus:border-orange-500 flex-1"
                                                placeholder="Link Name"
                                            />
                                            <Input 
                                                value={newLink.url} 
                                                onChange={e => setNewLink({ ...newLink, url: e.target.value })} 
                                                className="bg-black border-white/10 h-9 text-xs font-mono text-white focus:border-orange-500 flex-1"
                                                placeholder="https://..."
                                            />
                                            <button 
                                                onClick={handleAddLink}
                                                className="px-3 h-9 bg-orange-900/20 border border-orange-500/50 text-orange-500 hover:bg-orange-500/10 text-[10px] font-bold uppercase"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Contributors Section */}
                                    <div className="pt-4 border-t border-white/5 space-y-3">
                                        <label className="text-[10px] uppercase font-bold text-orange-500 tracking-widest">Contributors</label>
                                        
                                        {/* Added Contributors */}
                                        {newProjectData.contributors.length > 0 && (
                                            <div className="space-y-2 mb-3">
                                                {newProjectData.contributors.map((contributor, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 p-2 bg-orange-900/10 border border-orange-500/20">
                                                        <Users className="w-3 h-3 text-orange-500" />
                                                        <div className="flex-1 text-[10px] font-mono">
                                                            <span className="text-orange-400">{contributor.firstName}</span>
                                                            <span className="text-gray-500 ml-2">({contributor.globalPid})</span>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleRemoveContributor(idx)}
                                                            className="text-red-500 hover:text-red-400 p-1"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add Contributor Form */}
                                        <div className="flex gap-2">
                                            <Input 
                                                value={newContributor.globalPid} 
                                                onChange={e => setNewContributor({ ...newContributor, globalPid: e.target.value })} 
                                                className="bg-black border-white/10 h-9 text-xs font-mono text-white focus:border-orange-500 flex-1"
                                                placeholder="PID12345"
                                            />
                                            <Input 
                                                value={newContributor.firstName} 
                                                onChange={e => setNewContributor({ ...newContributor, firstName: e.target.value })} 
                                                className="bg-black border-white/10 h-9 text-xs font-mono text-white focus:border-orange-500 flex-1"
                                                placeholder="Name"
                                            />
                                            <button 
                                                onClick={handleAddContributor}
                                                className="px-3 h-9 bg-orange-900/20 border border-orange-500/50 text-orange-500 hover:bg-orange-500/10 text-[10px] font-bold uppercase"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleCreateProject}
                                        disabled={actionLoading}
                                        className="w-full h-12 bg-orange-900/20 border border-orange-500/50 text-orange-500 hover:bg-orange-500 hover:text-black font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 text-xs mt-4"
                                    >
                                        {actionLoading ? 'CREATING...' : 'CREATE_PROJECT'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
            <Footer />
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <Suspense fallback={
            <div className="h-screen w-screen bg-black flex items-center justify-center font-mono">
                <div className="text-cyan-500 animate-pulse tracking-widest text-xl">Loading Dashboard</div>
            </div>
        }>
            <AdminDashboardContent />
        </Suspense>
    );
}