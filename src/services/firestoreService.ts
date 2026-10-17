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

const DEFAULT_INITIAL_USERS: User[] = [
  {
    id: "usr-1",
    name: "Cristiano Ramos",
    username: "Cristiano",
    email: "cristiano@crservicosgerais.com.br",
    password: "Cristiano2026",
    role: "admin",
    jobTitle: "Administrador Geral / Diretor Operacional",
    phone: "(54) 99100-0000",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    active: true,
    createdAt: "2026-01-01T08:00:00.000Z"
  },
  {
    id: "usr-2",
    name: "Roberta Silveira",
    username: "gerencia",
    email: "gerencia@crservicosgerais.com.br",
    password: "123456",
    role: "manager",
    jobTitle: "Gerente Operacional",
    phone: "(54) 99100-1111",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    active: true,
    createdAt: "2026-01-01T08:00:00.000Z"
  },
  {
    id: "usr-3",
    name: "Técnico Operacional 01",
    username: "func01",
    email: "func01@crservicosgerais.com.br",
    password: "123456",
    role: "employee",
    jobTitle: "Técnico Operacional",
    phone: "(54) 99100-2222",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    active: true,
    createdAt: "2026-01-01T08:00:00.000Z"
  },
  {
    id: "usr-4",
    name: "Marcos Vinicius",
    username: "marcos",
    email: "marcos@crservicosgerais.com.br",
    password: "123456",
    role: "technician",
    jobTitle: "Técnico Especialista",
    phone: "(54) 99100-3333",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    active: true,
    createdAt: "2026-01-01T08:00:00.000Z"
  }
];

// ===================== USERS =====================
export async function getFirestoreUsers(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, "users"));
    let users = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));

    // Se o banco no Firestore estiver novo/vazio, semeia automaticamente os usuários padrão
    if (users.length === 0) {
      console.log("Semeando usuários padrão no Firestore...");
      for (const u of DEFAULT_INITIAL_USERS) {
        await setDoc(doc(db, "users", u.id), u, { merge: true });
      }
      users = [...DEFAULT_INITIAL_USERS];
    }

    return users;
  } catch (err) {
    console.error("Error fetching users from Firestore:", err);
    return DEFAULT_INITIAL_USERS;
  }
}

export async function findUserByCredentials(usernameOrEmail: string): Promise<User | null> {
  const cleanInput = usernameOrEmail.trim().toLowerCase();
  const users = await getFirestoreUsers();

  let user = users.find(
    u =>
      (u.username && u.username.toLowerCase() === cleanInput) ||
      (u.email && u.email.toLowerCase() === cleanInput) ||
      (u.name && u.name.toLowerCase() === cleanInput)
  );

  // Fallbacks de atalhos para login
  if (!user) {
    if (cleanInput === "cristiano" || cleanInput === "admin" || cleanInput === "administrador") {
      user = users.find(u => u.role === "admin") || users[0];
    } else if (cleanInput === "gerencia" || cleanInput === "manager") {
      user = users.find(u => u.role === "manager");
    } else if (cleanInput === "func01" || cleanInput === "funcionario") {
      user = users.find(u => u.role === "employee");
    } else if (cleanInput === "marcos" || cleanInput === "tecnico") {
      user = users.find(u => u.role === "technician");
    }
  }

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
