
import React, { useState, useEffect, useMemo, createContext, useContext, ReactNode } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';

// Firebase imports
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, orderBy, query, setDoc } from 'firebase/firestore';


// --- TYPE DEFINITIONS ---
interface Skill {
  name: string;
}

interface Experience {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
  order: number;
}

interface Project {
  id:string;
  title: string;
  shortDescription: string;
  longDescription: string;
  technologies: string[];
  imageUrl: string;
  githubUrl?: string;
  liveUrl?: string;
  date: string;
}

interface UserInfo {
  name: string;
  specialization: string;
  city: string;
  bio: string;
  avatarUrl: string;
  resumeUrl: string;
  contacts: {
    email: string;
    telegram: string;
    linkedin: string;
    github: string;
  };
  skills: Skill[];
}

const defaultUserInfo: UserInfo = {
  name: "Загрузка...",
  specialization: "Fullstack-разработчик",
  city: "Город",
  bio: "Загрузка информации...",
  avatarUrl: "",
  resumeUrl: "",
  contacts: { email: "", telegram: "", linkedin: "", github: "" },
  skills: [],
};


// --- CONTEXT ---
interface AppContextType {
  userInfo: UserInfo;
  experience: Experience[];
  projects: Project[];
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateUserInfo: (newInfo: UserInfo) => Promise<void>;
  addExperience: (exp: Omit<Experience, 'id'>) => Promise<void>;
  updateExperience: (exp: Experience) => Promise<void>;
  deleteExperience: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo>(defaultUserInfo);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userInfoDocRef = doc(db, 'userInfo', 'main');
        const userInfoSnap = await getDoc(userInfoDocRef);
        if (userInfoSnap.exists()) setUserInfo(userInfoSnap.data() as UserInfo);

        const experienceQuery = query(collection(db, 'experience'), orderBy('order', 'desc'));
        const experienceSnapshot = await getDocs(experienceQuery);
        setExperience(experienceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Experience)));

        const projectsQuery = query(collection(db, 'projects'), orderBy('date', 'desc'));
        const projectsSnapshot = await getDocs(projectsQuery);
        setProjects(projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));

      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        // Ensure loading is false after auth state is confirmed
        if (loading) {
            setLoading(false);
        }
    });

    return () => unsubscribe();
  }, []); // Only run once on mount

  const login = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass).then(() => {});
  const logout = () => signOut(auth);

  const addProject = async (projectData: Omit<Project, 'id'>) => {
    const docRef = await addDoc(collection(db, 'projects'), projectData);
    setProjects(prev => [{ ...projectData, id: docRef.id }, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  
  const updateProject = async (updatedProject: Project) => {
    const projectRef = doc(db, 'projects', updatedProject.id);
    const { id, ...dataToUpdate } = updatedProject;
    await updateDoc(projectRef, dataToUpdate);
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  
  const deleteProject = async (id: string) => {
    await deleteDoc(doc(db, 'projects', id));
    setProjects(prev => prev.filter(p => p.id !== id));
  };
    
  const updateUserInfo = async (newInfo: UserInfo) => {
    const userInfoRef = doc(db, 'userInfo', 'main');
    await setDoc(userInfoRef, newInfo, { merge: true });
    setUserInfo(newInfo);
  };
    
  const addExperience = async (expData: Omit<Experience, 'id'>) => {
    const docRef = await addDoc(collection(db, 'experience'), expData);
    setExperience(prev => [{...expData, id: docRef.id}, ...prev].sort((a,b) => b.order - a.order));
  };
    
  const updateExperience = async (updatedExp: Experience) => {
    const expRef = doc(db, 'experience', updatedExp.id);
    const { id, ...dataToUpdate } = updatedExp;
    await updateDoc(expRef, dataToUpdate);
    setExperience(prev => prev.map(e => e.id === updatedExp.id ? updatedExp : e).sort((a,b) => b.order - a.order));
  };
    
  const deleteExperience = async (id: string) => {
    await deleteDoc(doc(db, 'experience', id));
    setExperience(prev => prev.filter(e => e.id !== id));
  };

  const value = { userInfo, experience, projects, user, loading, login, logout, addProject, updateProject, deleteProject, updateUserInfo, addExperience, updateExperience, deleteExperience };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};

// --- ICONS (unchanged) ---
const GithubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
);
const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
);
const MailIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
);
const LinkedinIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
);

// --- LAYOUT & PAGE COMPONENTS ---
const Header: React.FC = () => {
    const { user, logout } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const navLinkClasses = (path: string) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === path ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`;

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <header className="bg-dark/80 backdrop-blur-sm sticky top-0 z-50">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="text-2xl font-bold text-primary">Портфолио</Link>
                    <div className="flex items-center space-x-4">
                        <Link to="/" className={navLinkClasses('/')}>Главная</Link>
                        <Link to="/projects" className={navLinkClasses('/projects')}>Проекты</Link>
                        {user ? (
                            <>
                                <Link to="/admin" className={navLinkClasses('/admin')}>Админка</Link>
                                <button onClick={handleLogout} className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white">Выйти</button>
                            </>
                        ) : (
                            <Link to="/login" className={navLinkClasses('/login')}>Войти</Link>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};

const Footer: React.FC = () => {
    const { userInfo } = useApp();
    return (
        <footer className="bg-gray-900 mt-16 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
                <p>&copy; {new Date().getFullYear()} {userInfo.name}. Все права защищены.</p>
                <div className="flex justify-center space-x-6 mt-4">
                    {userInfo.contacts.github && <a href={userInfo.contacts.github} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"><GithubIcon className="h-6 w-6" /></a>}
                    {userInfo.contacts.linkedin && <a href={userInfo.contacts.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"><LinkedinIcon className="h-6 w-6" /></a>}
                    {userInfo.contacts.email && <a href={`mailto:${userInfo.contacts.email}`} className="hover:text-primary transition-colors"><MailIcon className="h-6 w-6" /></a>}
                </div>
            </div>
        </footer>
    );
};

const HomePage: React.FC = () => {
    const { userInfo, experience } = useApp();
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
            <section className="flex flex-col md:flex-row items-center pt-16 md:pt-24 animate-fade-in-up">
                <div className="md:w-3/4 text-center md:text-left">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">{userInfo.name}</h1>
                    <p className="mt-2 text-xl md:text-2xl text-primary font-semibold">{userInfo.specialization}</p>
                    <p className="mt-4 max-w-2xl text-lg text-gray-300">{userInfo.bio}</p>
                    <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
                        <Link to="/projects" className="px-8 py-3 bg-primary text-dark font-bold rounded-lg hover:bg-opacity-80 transition-all transform hover:scale-105">Посмотреть проекты</Link>
                        {userInfo.resumeUrl && <a href={userInfo.resumeUrl} target="_blank" rel="noopener noreferrer" download className="px-8 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-all transform hover:scale-105">Скачать резюме</a>}
                    </div>
                </div>
                <div className="md:w-1/4 mt-8 md:mt-0 flex justify-center">
                    <img src={userInfo.avatarUrl || 'https://via.placeholder.com/256'} alt="Avatar" className="rounded-full w-48 h-48 md:w-64 md:h-64 object-cover shadow-2xl shadow-primary/20"/>
                </div>
            </section>
            <section style={{ animationDelay: '0.2s' }} className="animate-fade-in-up">
                <h2 className="text-3xl font-bold text-center mb-8">Навыки</h2>
                <div className="flex flex-wrap justify-center gap-3">
                    {userInfo.skills.map(skill => (<span key={skill.name} className="bg-gray-800 text-primary text-sm font-medium px-4 py-2 rounded-full">{skill.name}</span>))}
                </div>
            </section>
            <section style={{ animationDelay: '0.4s' }} className="animate-fade-in-up">
                <h2 className="text-3xl font-bold text-center mb-12">Опыт работы</h2>
                <div className="relative border-l-2 border-gray-700">
                    {experience.map((job, index) => (
                         <div key={job.id} className="relative mb-10 pl-8 animate-fade-in-up" style={{ animationDelay: `${0.5 + index * 0.1}s` }}>
                            <span className="absolute flex items-center justify-center w-6 h-6 bg-primary rounded-full -left-3 ring-8 ring-dark">
                                <svg className="w-2.5 h-2.5 text-dark" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4Z"/></svg>
                            </span>
                            <h3 className="flex flex-wrap items-center mb-1 text-lg font-semibold text-white"><span>{job.role}</span> <span className="text-secondary text-sm font-medium mr-2 px-2.5 py-0.5 rounded ml-3">{job.company}</span></h3>
                            <time className="block mb-2 text-sm font-normal leading-none text-gray-400">{job.period}</time>
                            <p className="mb-4 text-base font-normal text-gray-400">{job.description}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

const ProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => (
    <div onClick={onClick} className="bg-gray-800 rounded-lg overflow-hidden group cursor-pointer transform hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:shadow-primary/30">
        <img src={project.imageUrl || 'https://via.placeholder.com/400x300'} alt={project.title} className="w-full h-48 object-cover group-hover:opacity-75 transition-opacity" />
        <div className="p-6">
            <h3 className="text-xl font-bold mb-2">{project.title}</h3>
            <p className="text-gray-400 text-sm mb-4">{project.shortDescription}</p>
            <div className="flex flex-wrap gap-2">{project.technologies.map(tech => (<span key={tech} className="text-xs font-semibold bg-secondary/20 text-secondary px-2 py-1 rounded">{tech}</span>))}</div>
        </div>
    </div>
);

const ProjectModal: React.FC<{ project: Project | null; onClose: () => void }> = ({ project, onClose }) => {
    if (!project) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in-up" style={{animationDuration: '0.3s'}} onClick={onClose}>
            <div className="bg-gray-800 rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-8">
                    <div className="flex justify-between items-start">
                        <h2 className="text-3xl font-bold mb-4">{project.title}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                    </div>
                    <img src={project.imageUrl || 'https://via.placeholder.com/800x400'} alt={project.title} className="w-full h-64 object-cover rounded-md mb-6" />
                    <div className="flex flex-wrap gap-2 mb-6">{project.technologies.map(tech => (<span key={tech} className="text-xs font-semibold bg-secondary/20 text-secondary px-2 py-1 rounded">{tech}</span>))}</div>
                    <p className="text-gray-300 whitespace-pre-wrap">{project.longDescription}</p>
                    <div className="mt-8 flex gap-4">
                        {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-all"><GithubIcon className="h-5 w-5 mr-2" /> GitHub</a>}
                        {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 bg-primary text-dark font-bold rounded-lg hover:bg-opacity-80 transition-all"><ExternalLinkIcon className="h-5 w-5 mr-2" /> Live Demo</a>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProjectsPage: React.FC = () => {
    const { projects } = useApp();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>('All');
    const allTechnologies = useMemo(() => ['All', ...Array.from(new Set(projects.flatMap(p => p.technologies)))], [projects]);
    const filteredProjects = useMemo(() => activeFilter === 'All' ? projects : projects.filter(p => p.technologies.includes(activeFilter)), [projects, activeFilter]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h1 className="text-4xl font-bold text-center mb-4">Мои проекты</h1>
            <p className="text-lg text-gray-400 text-center mb-12">Здесь собраны некоторые из моих работ, от веб-приложений до API.</p>
            <div className="flex justify-center flex-wrap gap-2 mb-12">
                {allTechnologies.map(tech => (<button key={tech} onClick={() => setActiveFilter(tech)} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${activeFilter === tech ? 'bg-primary text-dark' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>{tech}</button>))}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">{filteredProjects.map(project => (<ProjectCard key={project.id} project={project} onClick={() => setSelectedProject(project)} />))}</div>
            <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
        </div>
    );
};

const LoginPage: React.FC = () => {
    const { login } = useApp();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);
        try {
            await login(email, password);
            navigate('/admin');
        } catch (err) {
            setError('Не удалось войти. Проверьте email и пароль.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-sm">
                <h2 className="text-2xl font-bold text-center mb-6">Вход в панель администратора</h2>
                <form onSubmit={handleLogin}>
                    <div className="mb-4"><label className="block text-gray-400 mb-2" htmlFor="email">Email</label><input className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-primary" type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required/></div>
                    <div className="mb-6"><label className="block text-gray-400 mb-2" htmlFor="password">Пароль</label><input className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-primary" type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required/></div>
                    {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                    <button type="submit" className="w-full bg-primary text-dark font-bold py-2 rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50" disabled={isLoggingIn}>{isLoggingIn ? 'Вход...' : 'Войти'}</button>
                </form>
            </div>
        </div>
    );
};

// --- ADMIN COMPONENTS ---

const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, loading } = useApp();
    if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-xl text-primary">Проверка авторизации...</p></div>;
    return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const FormInput: React.FC<{label: string, name: string, value: string, onChange: (e: any) => void, type?: string, required?: boolean}> = ({label, name, value, onChange, type='text', required=true}) => (
    <div><label className="text-sm text-gray-300 block mb-1">{label}</label><input type={type} name={name} value={value} onChange={onChange} className="w-full bg-gray-700 p-2 rounded mt-1 border border-gray-600 focus:outline-none focus:border-primary" required={required}/></div>
);

const FormTextarea: React.FC<{label: string, name: string, value: string, onChange: (e: any) => void, required?: boolean}> = ({label, name, value, onChange, required=true}) => (
    <div><label className="text-sm text-gray-300 block mb-1">{label}</label><textarea name={name} value={value} onChange={onChange} className="w-full bg-gray-700 p-2 rounded mt-1 h-32 border border-gray-600 focus:outline-none focus:border-primary" required={required}/></div>
);

const ProjectForm: React.FC<{ projectToEdit: Project | null; onSave: (data: Omit<Project, 'id' | 'technologies'> & { technologies: string[] }) => Promise<void>; onCancel: () => void; }> = ({ projectToEdit, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        title: projectToEdit?.title || '',
        shortDescription: projectToEdit?.shortDescription || '',
        longDescription: projectToEdit?.longDescription || '',
        technologies: projectToEdit?.technologies || [],
        imageUrl: projectToEdit?.imageUrl || '',
        githubUrl: projectToEdit?.githubUrl || '',
        liveUrl: projectToEdit?.liveUrl || '',
        date: projectToEdit?.date || new Date().toISOString().split('T')[0],
    });
    const [currentTech, setCurrentTech] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    
    const handleAddTech = () => {
        const trimmedTech = currentTech.trim();
        if (trimmedTech && !formData.technologies.includes(trimmedTech)) {
            setFormData(prev => ({ ...prev, technologies: [...prev.technologies, trimmedTech] }));
            setCurrentTech('');
        }
    };

    const handleRemoveTech = (indexToRemove: number) => {
        setFormData(prev => ({ ...prev, technologies: prev.technologies.filter((_, index) => index !== indexToRemove) }));
    };

    const handleTechKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTech();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const trimmedData = {
            ...formData,
            imageUrl: (formData.imageUrl || '').trim(),
            githubUrl: (formData.githubUrl || '').trim(),
            liveUrl: (formData.liveUrl || '').trim(),
        };
        await onSave(trimmedData);
        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-bold">{projectToEdit ? 'Редактировать проект' : 'Добавить проект'}</h3>
            <FormInput label="Название" name="title" value={formData.title} onChange={handleChange} />
            <FormInput label="Краткое описание" name="shortDescription" value={formData.shortDescription} onChange={handleChange} />
            <FormTextarea label="Полное описание" name="longDescription" value={formData.longDescription} onChange={handleChange} />
            
            <div>
                <label className="text-sm text-gray-300 block mb-1">Технологии</label>
                <div className="flex flex-wrap gap-2 p-2 bg-gray-900/50 rounded-md min-h-[40px]">
                    {formData.technologies.map((tech, index) => (
                        <div key={index} className="flex items-center bg-gray-700 px-3 py-1 rounded-full text-sm">
                            <span>{tech}</span>
                            <button type="button" onClick={() => handleRemoveTech(index)} className="ml-2 text-red-400 hover:text-red-300 font-bold">&times;</button>
                        </div>
                    ))}
                </div>
                <div className="flex mt-2">
                    <input
                        type="text"
                        value={currentTech}
                        onChange={(e) => setCurrentTech(e.target.value)}
                        onKeyDown={handleTechKeyDown}
                        className="w-full bg-gray-700 p-2 rounded-l-md border border-gray-600 focus:outline-none focus:border-primary"
                        placeholder="Добавить технологию"
                    />
                    <button
                        type="button"
                        onClick={handleAddTech}
                        className="bg-primary text-dark font-bold px-4 rounded-r-md hover:bg-opacity-80"
                    >
                        +
                    </button>
                </div>
            </div>

            <FormInput label="Дата (YYYY-MM-DD)" name="date" type="date" value={formData.date} onChange={handleChange} />
            <FormInput label="URL Обложки проекта" name="imageUrl" value={formData.imageUrl} onChange={handleChange} required={false}/>
            {formData.imageUrl && <img src={formData.imageUrl} alt="preview" className="mt-2 h-24 rounded object-cover"/>}
            <FormInput label="URL GitHub" name="githubUrl" value={formData.githubUrl} onChange={handleChange} required={false} />
            <FormInput label="URL Live Demo" name="liveUrl" value={formData.liveUrl} onChange={handleChange} required={false} />
            <div className="flex gap-4">
               <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary text-dark font-bold rounded-lg hover:bg-opacity-80 disabled:opacity-50">{isSaving ? 'Сохранение...' : 'Сохранить'}</button>
               <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500">Отмена</button>
            </div>
        </form>
    );
};

const ExperienceForm: React.FC<{ experienceToEdit: Experience | null; onSave: (data: Omit<Experience, 'id'>) => Promise<void>; onCancel: () => void; }> = ({ experienceToEdit, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        role: experienceToEdit?.role || '',
        company: experienceToEdit?.company || '',
        period: experienceToEdit?.period || '',
        description: experienceToEdit?.description || '',
        order: experienceToEdit?.order || 0,
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 0 : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-bold">{experienceToEdit ? 'Редактировать опыт' : 'Добавить опыт'}</h3>
            <FormInput label="Должность" name="role" value={formData.role} onChange={handleChange} />
            <FormInput label="Компания" name="company" value={formData.company} onChange={handleChange} />
            <FormInput label="Период (напр. 2020 - 2022)" name="period" value={formData.period} onChange={handleChange} />
            <FormTextarea label="Описание" name="description" value={formData.description} onChange={handleChange} />
            <FormInput label="Порядок сортировки (число, больше - выше)" name="order" type="number" value={formData.order.toString()} onChange={handleChange} />
            <div className="flex gap-4">
               <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary text-dark font-bold rounded-lg hover:bg-opacity-80 disabled:opacity-50">{isSaving ? 'Сохранение...' : 'Сохранить'}</button>
               <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500">Отмена</button>
            </div>
        </form>
    );
};

const UserInfoForm: React.FC<{ currentUserInfo: UserInfo; onSave: (data: UserInfo) => Promise<void>; }> = ({ currentUserInfo, onSave }) => {
    const [formData, setFormData] = useState({ ...currentUserInfo });
    const [newSkill, setNewSkill] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(currentUserInfo);
    }, [currentUserInfo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // FIX: The `UserInfo` type guarantees `prev.contacts` exists.
        // The `|| {}` was causing TypeScript to incorrectly infer that the `contacts`
        // object could be partial, which violates the type definition.
        setFormData(prev => ({ ...prev, contacts: { ...prev.contacts, [name]: value } }));
    };

    const handleAddSkill = () => {
        const trimmedSkill = newSkill.trim();
        if (trimmedSkill && !formData.skills.some(s => s.name === trimmedSkill)) {
            const newSkillsArray = [...formData.skills, { name: trimmedSkill }];
            setFormData(prev => ({ ...prev, skills: newSkillsArray }));
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (indexToRemove: number) => {
        const newSkillsArray = formData.skills.filter((_, index) => index !== indexToRemove);
        setFormData(prev => ({ ...prev, skills: newSkillsArray }));
    };

    const handleSkillKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSkill();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const dataToSave = {
            ...formData,
            avatarUrl: (formData.avatarUrl || '').trim(),
            resumeUrl: (formData.resumeUrl || '').trim(),
            contacts: {
                email: (formData.contacts?.email || '').trim(),
                telegram: (formData.contacts?.telegram || '').trim(),
                linkedin: (formData.contacts?.linkedin || '').trim(),
                github: (formData.contacts?.github || '').trim(),
            }
        };
        await onSave(dataToSave);
        setIsSaving(false);
        alert('Информация обновлена!');
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-bold">Редактировать личную информацию</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
                <FormInput label="Имя" name="name" value={formData.name} onChange={handleChange} />
                <FormInput label="Специализация" name="specialization" value={formData.specialization} onChange={handleChange} />
                <FormInput label="Город" name="city" value={formData.city} onChange={handleChange} />
                <FormInput label="URL Резюме для скачивания" name="resumeUrl" value={formData.resumeUrl} onChange={handleChange} required={false}/>
            </div>

            <FormTextarea label="О себе (био)" name="bio" value={formData.bio} onChange={handleChange} />
            
            <FormInput label="URL Аватара" name="avatarUrl" value={formData.avatarUrl} onChange={handleChange} required={false} />
            {formData.avatarUrl && <img src={formData.avatarUrl} alt="avatar preview" className="mt-2 h-24 w-24 rounded-full object-cover"/>}
            
            <div>
                <label className="text-sm text-gray-300 block mb-1">Навыки</label>
                <div className="flex flex-wrap gap-2 p-2 bg-gray-900/50 rounded-md min-h-[40px]">
                    {formData.skills.map((skill, index) => (
                        <div key={index} className="flex items-center bg-gray-700 px-3 py-1 rounded-full text-sm">
                            <span>{skill.name}</span>
                            <button type="button" onClick={() => handleRemoveSkill(index)} className="ml-2 text-red-400 hover:text-red-300 font-bold">&times;</button>
                        </div>
                    ))}
                </div>
                <div className="flex mt-2">
                    <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={handleSkillKeyDown}
                        className="w-full bg-gray-700 p-2 rounded-l-md border border-gray-600 focus:outline-none focus:border-primary"
                        placeholder="Добавить навык"
                    />
                    <button
                        type="button"
                        onClick={handleAddSkill}
                        className="bg-primary text-dark font-bold px-4 rounded-r-md hover:bg-opacity-80"
                    >
                        +
                    </button>
                </div>
            </div>
            
            <h4 className="text-lg font-semibold pt-4 border-t border-gray-700">Контакты</h4>
            <div className="grid md:grid-cols-2 gap-4">
                <FormInput label="Email" name="email" value={formData.contacts?.email || ''} onChange={handleContactChange} type="email" required={false} />
                <FormInput label="Telegram URL" name="telegram" value={formData.contacts?.telegram || ''} onChange={handleContactChange} required={false} />
                <FormInput label="LinkedIn URL" name="linkedin" value={formData.contacts?.linkedin || ''} onChange={handleContactChange} required={false} />
                <FormInput label="GitHub URL" name="github" value={formData.contacts?.github || ''} onChange={handleContactChange} required={false} />
            </div>

            <div className="pt-4">
               <button type="submit" disabled={isSaving} className="px-6 py-2 bg-primary text-dark font-bold rounded-lg hover:bg-opacity-80 disabled:opacity-50">{isSaving ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
        </form>
    );
};

const AdminPage: React.FC = () => {
    const { projects, experience, userInfo, addProject, updateProject, deleteProject, updateUserInfo, addExperience, updateExperience, deleteExperience, logout } = useApp();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('projects');
    
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [isProjectFormVisible, setIsProjectFormVisible] = useState(false);
    
    const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
    const [isExperienceFormVisible, setIsExperienceFormVisible] = useState(false);
    
    const handleLogout = async () => { await logout(); navigate('/'); };

    const renderProjects = () => (
        <div>
            {isProjectFormVisible ? (
                <ProjectForm 
                    projectToEdit={editingProject} 
                    onSave={async (data) => {
                        await (editingProject ? updateProject({ ...editingProject, ...data }) : addProject(data));
                        setIsProjectFormVisible(false); setEditingProject(null);
                    }} 
                    onCancel={() => { setIsProjectFormVisible(false); setEditingProject(null); }} 
                />
            ) : (
                <button onClick={() => { setEditingProject(null); setIsProjectFormVisible(true); }} className="mb-4 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500">Добавить проект</button>
            )}
            <div className="mt-6 space-y-4">
                {projects.map(p => (
                    <div key={p.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                        <div><h4 className="font-bold">{p.title}</h4><p className="text-sm text-gray-400">{p.shortDescription}</p></div>
                        <div className="flex gap-2"><button onClick={() => { setEditingProject(p); setIsProjectFormVisible(true);}} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">Редакт.</button><button onClick={() => window.confirm('Вы уверены?') && deleteProject(p.id)} className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500">Удалить</button></div>
                    </div>
                ))}
            </div>
        </div>
    );
    
    const renderExperience = () => (
        <div>
            {isExperienceFormVisible ? (
                <ExperienceForm 
                    experienceToEdit={editingExperience} 
                    onSave={async (data) => {
                        await (editingExperience ? updateExperience({ ...editingExperience, ...data }) : addExperience(data));
                        setIsExperienceFormVisible(false); setEditingExperience(null);
                    }} 
                    onCancel={() => { setIsExperienceFormVisible(false); setEditingExperience(null); }} 
                />
            ) : (
                <button onClick={() => { setEditingExperience(null); setIsExperienceFormVisible(true); }} className="mb-4 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500">Добавить опыт работы</button>
            )}
            <div className="mt-6 space-y-4">
                {experience.map(exp => (
                    <div key={exp.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                        <div><h4 className="font-bold">{exp.role} at {exp.company}</h4><p className="text-sm text-gray-400">{exp.period}</p></div>
                        <div className="flex gap-2"><button onClick={() => { setEditingExperience(exp); setIsExperienceFormVisible(true);}} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">Редакт.</button><button onClick={() => window.confirm('Вы уверены?') && deleteExperience(exp.id)} className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500">Удалить</button></div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderUserInfo = () => (
         <UserInfoForm 
            currentUserInfo={userInfo}
            onSave={updateUserInfo}
        />
    );
    
    const tabs = [
        { key: 'projects', label: 'Проекты' },
        { key: 'experience', label: 'Опыт работы' },
        { key: 'info', label: 'Личная информация' },
    ];
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Панель администратора</h1>
                {/* Logout button is now in Header */}
            </div>

            <div className="flex border-b border-gray-700 mb-6">
                {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`py-2 px-4 text-lg font-medium transition-colors ${activeTab === tab.key ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-white'}`}>{tab.label}</button>
                ))}
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg">
                {activeTab === 'projects' && renderProjects()}
                {activeTab === 'experience' && renderExperience()}
                {activeTab === 'info' && renderUserInfo()}
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

const AppContent: React.FC = () => {
  const { loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl text-primary mt-4">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
}