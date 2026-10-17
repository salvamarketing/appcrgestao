import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
  User,
  WorkOrder,
  Customer,
  ServiceItem,
  Technician,
  FinancialTransaction,
  Quote,
  AuditLog,
  CompanySettings
} from "../types";

// ===================== USERS =====================
export async function getFirestoreUsers(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
  } catch (err) {
    console.error("Error fetching users from Firestore:", err);
    return [];
  }
}

export async function findUserByCredentials(usernameOrEmail: string): Promise<User | null> {
  const cleanInput = usernameOrEmail.trim().toLowerCase();
  const users = await getFirestoreUsers();
  const user = users.find(
    u =>
      (u.username && u.username.toLowerCase() === cleanInput) ||
      (u.email && u.email.toLowerCase() === cleanInput)
  );
  return user || null;
}

export async function saveFirestoreUser(user: Partial<User> & { id: string }): Promise<void> {
  await setDoc(doc(db, "users", user.id), user, { merge: true });
}

// ===================== WORK ORDERS =====================
export async function getFirestoreWorkOrders(): Promise<WorkOrder[]> {
  try {
    const snap = await getDocs(collection(db, "workOrders"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkOrder));
  } catch (err) {
    console.error("Error fetching workOrders from Firestore:", err);
    return [];
  }
}

export async function saveFirestoreWorkOrder(workOrder: WorkOrder): Promise<void> {
  await setDoc(doc(db, "workOrders", workOrder.id), workOrder, { merge: true });
}

export async function deleteFirestoreWorkOrder(id: string): Promise<void> {
  await deleteDoc(doc(db, "workOrders", id));
}

// ===================== CUSTOMERS =====================
export async function getFirestoreCustomers(): Promise<Customer[]> {
  try {
    const snap = await getDocs(collection(db, "customers"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
  } catch (err) {
    console.error("Error fetching customers from Firestore:", err);
    return [];
  }
}

export async function saveFirestoreCustomer(customer: Customer): Promise<void> {
  await setDoc(doc(db, "customers", customer.id), customer, { merge: true });
}

// ===================== SERVICES =====================
export async function getFirestoreServices(): Promise<ServiceItem[]> {
  try {
    const snap = await getDocs(collection(db, "services"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceItem));
  } catch (err) {
    console.error("Error fetching services from Firestore:", err);
    return [];
  }
}

// ===================== TECHNICIANS =====================
export async function getFirestoreTechnicians(): Promise<Technician[]> {
  try {
    const snap = await getDocs(collection(db, "technicians"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Technician));
  } catch (err) {
    console.error("Error fetching technicians from Firestore:", err);
    return [];
  }
}

// ===================== AUDIT LOGS =====================
export async function getFirestoreAuditLogs(): Promise<AuditLog[]> {
  try {
    const snap = await getDocs(collection(db, "auditLogs"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
  } catch (err) {
    console.error("Error fetching auditLogs from Firestore:", err);
    return [];
  }
}

export async function addFirestoreAuditLog(log: AuditLog): Promise<void> {
  await setDoc(doc(db, "auditLogs", log.id), log, { merge: true });
}
