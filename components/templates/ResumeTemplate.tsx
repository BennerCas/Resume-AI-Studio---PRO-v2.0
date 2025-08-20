import React from 'react';
import { ResumeData, ContactInfo } from '../../types';

interface ResumeTemplateProps {
  data: ResumeData;
  isCoverLetter?: boolean;
}

const getContrastColor = (hex: string): string => {
    if (!hex) return '#000000';
    if (hex.startsWith('#')) hex = hex.slice(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? '#000000' : '#FFFFFF';
};

const parseAndStyleText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => {
        line = line.trim();
        if (line.startsWith('- ')) {
            return <li key={index} className="ml-4 list-disc">{line.substring(2)}</li>;
        }
        return <p key={index} className="mb-2">{line}</p>;
    });
};

const getProfilePictureClasses = (shape: 'circle' | 'square' | 'brush') => {
  switch (shape) {
    case 'square':
      return 'rounded-xl';
    case 'brush':
      return ''; // Style is applied via inline style
    case 'circle':
    default:
      return 'rounded-full';
  }
};

const getProfilePictureBaseStyle = (shape: 'circle' | 'square' | 'brush', borderColor: string): React.CSSProperties => {
  const style: React.CSSProperties = { borderColor };
  if (shape === 'brush') {
    style.clipPath = 'url(#brush-stroke-clip)';
  }
  return style;
};

const getPositionContainerClasses = (position: 'left' | 'center' | 'right') => {
  switch (position) {
    case 'left':
      return 'flex justify-start';
    case 'right':
      return 'flex justify-end';
    case 'center':
    default:
      return 'flex justify-center';
  }
};

const ContactItem: React.FC<{ contactInfo: ContactInfo, defaultProtocol?: string, className?: string }> = ({ contactInfo, defaultProtocol, className = '' }) => {
    if (!contactInfo?.value) return null;
    
    const hasLink = contactInfo.link && contactInfo.link.trim() !== '';
    const href = hasLink ? contactInfo.link : (defaultProtocol ? `${defaultProtocol}:${contactInfo.value}` : '#');

    if (hasLink || defaultProtocol) {
        return <a href={href} target="_blank" rel="noopener noreferrer" className={`break-words hover:underline ${className}`}>{contactInfo.value}</a>;
    }
    return <p className={`break-words ${className}`}>{contactInfo.value}</p>;
};

const Section: React.FC<{ title: string; children: React.ReactNode; borderColor: string; sectionTitleColor: string; className?: string }> = ({ title, children, borderColor, sectionTitleColor, className }) => (
    <div className={`mb-4 ${className}`}>
        <h2 className="text-lg font-bold font-slab border-b-2" style={{ borderColor, color: sectionTitleColor }}>{title.toUpperCase()}</h2>
        <div className="mt-2 text-sm">
            {children}
        </div>
    </div>
);

const SkillTags: React.FC<{ skills: string; backgroundColor: string; textColor: string; className?: string }> = ({ skills, backgroundColor, textColor, className = '' }) => (
    <div className={`flex flex-wrap gap-2 ${className}`}>
       {skills.split(',').map(s => s.trim()).filter(s => s).map(skill => (
           <span key={skill} style={{ backgroundColor, color: textColor }} className="text-xs font-semibold px-2.5 py-0.5 rounded-full">
               {skill}
           </span>
       ))}
    </div>
);


const BannerLayout: React.FC<ResumeTemplateProps> = ({ data }) => {
    const { style } = data;
    const isImage = style.headerBackgroundType === 'image' && style.headerImageUrl;
    const { profilePictureShape, borderColor, profilePictureSize, sectionTitleColor, skillBackgroundColor, skillTextColor } = style;
    
    const headerStyle: React.CSSProperties = isImage
        ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${style.headerImageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { backgroundColor: style.headerColor };
        
    const headerTextColor = isImage ? '#FFFFFF' : getContrastColor(style.headerColor);

    const headerAlignment = style.layout === 'centered' ? 'text-center items-center' : 'text-left items-start';
    const profilePicContainerAlignment = style.layout === 'centered' ? 'justify-center' : getPositionContainerClasses(style.profilePicturePosition);
    const contentGrid = style.layout === 'infographic' ? 'md:grid-cols-1 gap-4' : 'md:grid-cols-3 gap-8';

    const profilePicStyle = {
        ...getProfilePictureBaseStyle(profilePictureShape, borderColor),
        width: `${profilePictureSize}px`,
        height: `${profilePictureSize}px`,
    };

    const bannerProfilePicStyle = {
        ...profilePicStyle,
        marginTop: `-${profilePictureSize * 0.75}px`
    }

    return (
        <div className="flex flex-col">
            <header 
                className={`flex flex-col ${headerAlignment}`} 
                style={{ ...headerStyle, color: headerTextColor, aspectRatio: isImage ? '4 / 1' : 'auto', objectFit: 'cover', paddingBottom: (style.layout === 'banner' && style.profilePictureUrl) ? `${profilePictureSize * 0.25}px` : 0 }}
            >
                {style.layout !== 'banner' && (
                    <div className="p-[1.5cm]">
                        {style.profilePictureUrl && (
                            <div className={`w-full flex ${profilePicContainerAlignment} mb-4`}>
                                <img 
                                    src={style.profilePictureUrl} 
                                    alt={data.personal.name} 
                                    className={`object-cover border-4 ${getProfilePictureClasses(profilePictureShape)}`}
                                    style={profilePicStyle}
                                />
                            </div>
                        )}
                        <div>
                            <h1 className="text-4xl font-bold font-slab uppercase">{data.personal.name}</h1>
                            <h2 className="text-xl font-light capitalize">{data.personal.title}</h2>
                            {data.personal.definingPhrase && <p className="mt-2 italic font-semibold">"{data.personal.definingPhrase}"</p>}
                        </div>
                    </div>
                 )}
            </header>
            <div className={`flex-grow grid grid-cols-1 ${contentGrid} p-[1.5cm]`}>
                <aside className="md:col-span-1">
                    {style.layout === 'banner' && style.profilePictureUrl && (
                        <div className={`w-full flex ${profilePicContainerAlignment} mb-4`}>
                            <img 
                                src={style.profilePictureUrl} 
                                alt={data.personal.name} 
                                className={`object-cover border-4 bg-white ${getProfilePictureClasses(profilePictureShape)}`}
                                style={bannerProfilePicStyle}
                            />
                        </div>
                    )}
                     {style.layout === 'banner' && (
                        <div className="text-center mb-4">
                            <h1 className="text-4xl font-bold font-slab uppercase">{data.personal.name}</h1>
                            <h2 className="text-xl font-light capitalize">{data.personal.title}</h2>
                            {data.personal.definingPhrase && <p className="mt-2 italic font-semibold">"{data.personal.definingPhrase}"</p>}
                        </div>
                    )}
                    <Section title="Contacto" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                        <div className="flex flex-col space-y-1">
                            <ContactItem contactInfo={data.personal.phone} defaultProtocol="tel" />
                            <ContactItem contactInfo={data.personal.phone2} defaultProtocol="tel" />
                            <ContactItem contactInfo={data.personal.email} defaultProtocol="mailto" />
                            <ContactItem contactInfo={data.personal.email2} defaultProtocol="mailto" />
                            <ContactItem contactInfo={data.personal.linkedin} />
                        </div>
                    </Section>
                    <Section title="Habilidades" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                        <SkillTags skills={data.skills} backgroundColor={skillBackgroundColor} textColor={skillTextColor} />
                    </Section>
                    <Section title="Educación" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                        {data.education.map(edu => (
                            <div key={edu.id} className="mb-2 item-wrapper">
                                <h3 className="font-bold">{edu.degree}</h3>
                                <p className="italic">{edu.school}</p>
                                <p className="text-xs">{edu.date}</p>
                            </div>
                        ))}
                    </Section>
                </aside>
                <main className={style.layout === 'infographic' ? 'md:col-span-1' : 'md:col-span-2'}>
                    <Section title="Resumen Profesional" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                        {parseAndStyleText(data.summary)}
                    </Section>
                    <Section title="Experiencia Laboral" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                        {data.experience.map(exp => (
                            <div key={exp.id} className="mb-4 item-wrapper">
                                <h3 className="font-bold">{exp.title}</h3>
                                <p className="italic">{exp.company} | {exp.date}</p>
                                <div className="prose prose-sm max-w-none">{parseAndStyleText(exp.description)}</div>
                            </div>
                        ))}
                    </Section>
                     <Section title="Logros Clave" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                        {parseAndStyleText(data.achievements)}
                    </Section>
                     <Section title="Fortalezas Clave" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                        {parseAndStyleText(data.strengths)}
                    </Section>
                    {data.cta && (
                        <Section title="LLAMADA A LA ACCIÓN" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                            <div className="text-center italic p-3 rounded-md" style={{ backgroundColor: skillBackgroundColor, color: skillTextColor }}>
                                {parseAndStyleText(data.cta)}
                            </div>
                        </Section>
                    )}
                </main>
            </div>
        </div>
    );
};

const DualColumnLayout: React.FC<ResumeTemplateProps> = ({ data }) => {
    const { style } = data;
    const leftBgColor = style.headerColor;
    const leftTextColor = getContrastColor(style.headerColor);
    const { profilePictureShape, borderColor, profilePictureSize, sectionTitleColor, skillBackgroundColor, skillTextColor } = style;

    const asideWidth = style.layout === 'modern' ? 'w-1/4' : (style.layout === 'corporate' ? 'w-2/5' : 'w-1/3');
    const mainWidth = style.layout === 'modern' ? 'w-3/4' : (style.layout === 'corporate' ? 'w-3/5' : 'w-2/3');
    const headerAlignment = style.layout === 'modern' || style.layout === 'technical' ? 'text-left' : 'text-center';
    
    const profilePicStyle = {
        ...getProfilePictureBaseStyle(profilePictureShape, borderColor),
        width: `${profilePictureSize}px`,
        height: `${profilePictureSize}px`,
    };

    return (
        <div className="flex">
            <aside className={`${asideWidth} p-[1.5cm]`} style={{ backgroundColor: leftBgColor, color: leftTextColor }}>
                {style.profilePictureUrl && (
                     <div className={`mb-4 ${getPositionContainerClasses(style.profilePicturePosition)}`}>
                        <img
                            src={style.profilePictureUrl}
                            alt={data.personal.name}
                            className={`object-cover border-4 ${getProfilePictureClasses(profilePictureShape)}`}
                            style={profilePicStyle}
                        />
                    </div>
                )}
                <div className={`${headerAlignment} mb-6`}>
                    <h1 className={`text-3xl font-bold font-slab uppercase`}>{data.personal.name}</h1>
                    <h2 className="text-lg font-light capitalize">{data.personal.title}</h2>
                    {data.personal.definingPhrase && <p className="mt-2 italic font-semibold">"{data.personal.definingPhrase}"</p>}
                </div>
                <div className="mb-4 text-sm item-wrapper">
                    <h3 className="text-lg font-bold font-slab mb-2 border-b-2" style={{ borderColor: borderColor }}>CONTACTO</h3>
                    <div className="flex flex-col space-y-1">
                        <ContactItem contactInfo={data.personal.phone} defaultProtocol="tel" />
                        <ContactItem contactInfo={data.personal.phone2} defaultProtocol="tel" />
                        <ContactItem contactInfo={data.personal.email} defaultProtocol="mailto" />
                        <ContactItem contactInfo={data.personal.email2} defaultProtocol="mailto" />
                        <ContactItem contactInfo={data.personal.linkedin} />
                    </div>
                </div>
                 <div className="mb-4 item-wrapper">
                    <h3 className="text-lg font-bold font-slab mb-2 border-b-2" style={{ borderColor: borderColor }}>HABILIDADES</h3>
                    <SkillTags skills={data.skills} backgroundColor={skillBackgroundColor} textColor={skillTextColor} />
                </div>
                <div className="mb-4 item-wrapper">
                    <h3 className="text-lg font-bold font-slab mb-2 border-b-2" style={{ borderColor: borderColor }}>EDUCACIÓN</h3>
                     {data.education.map(edu => (
                        <div key={edu.id} className="mb-2 text-sm">
                            <h4 className="font-bold">{edu.degree}</h4>
                            <p>{edu.school}</p>
                            <p className="text-xs">{edu.date}</p>
                        </div>
                    ))}
                </div>
            </aside>
            <main className={`${mainWidth} p-[1.5cm]`}>
                 <Section title="Resumen Profesional" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                    {parseAndStyleText(data.summary)}
                </Section>
                 <Section title="Experiencia" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                    {data.experience.map(exp => (
                        <div key={exp.id} className="mb-4 item-wrapper">
                            <h3 className="font-bold">{exp.title}</h3>
                            <p className="italic text-sm">{exp.company} | {exp.date}</p>
                            <div className="prose prose-sm max-w-none">{parseAndStyleText(exp.description)}</div>
                        </div>
                    ))}
                </Section>
                <Section title="Logros Clave" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                    <div className="prose prose-sm max-w-none">{parseAndStyleText(data.achievements)}</div>
                </Section>
                <Section title="Fortalezas" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                     <div className="prose prose-sm max-w-none">{parseAndStyleText(data.strengths)}</div>
                </Section>
                {data.cta && (
                    <Section title="LLAMADA A LA ACCIÓN" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                        <div className="text-center italic p-3 rounded-md" style={{ backgroundColor: skillBackgroundColor, color: skillTextColor }}>
                            {parseAndStyleText(data.cta)}
                        </div>
                    </Section>
                )}
            </main>
        </div>
    );
};

const MinimalistLayout: React.FC<ResumeTemplateProps> = ({ data }) => {
    const { style } = data;
    const { profilePictureShape, borderColor, profilePictureSize, sectionTitleColor, skillBackgroundColor, skillTextColor } = style;
    
    const profilePicStyle = {
        ...getProfilePictureBaseStyle(profilePictureShape, borderColor),
        width: `${profilePictureSize}px`,
        height: `${profilePictureSize}px`,
    };

    return (
        <div className="flex flex-col items-center text-center p-[1.5cm]">
            {style.profilePictureUrl && (
                <div className={getPositionContainerClasses(style.profilePicturePosition)}>
                    <img 
                        src={style.profilePictureUrl} 
                        alt={data.personal.name} 
                        className={`mb-4 object-cover border-4 ${getProfilePictureClasses(profilePictureShape)}`}
                        style={profilePicStyle}
                    />
                </div>
            )}
            <h1 className="text-4xl font-bold font-slab uppercase">{data.personal.name}</h1>
            <h2 className="text-xl font-light mt-1 capitalize">{data.personal.title}</h2>
            {data.personal.definingPhrase && <p className="mt-2 italic font-semibold">"{data.personal.definingPhrase}"</p>}
            <div className="flex gap-x-4 gap-y-1 justify-center flex-wrap text-sm mt-4 text-gray-600">
                <ContactItem contactInfo={data.personal.phone} defaultProtocol="tel" />
                {data.personal.phone.value && <span className="text-gray-400">&bull;</span>}
                <ContactItem contactInfo={data.personal.phone2} defaultProtocol="tel" />
                {data.personal.phone2.value && <span className="text-gray-400">&bull;</span>}
                <ContactItem contactInfo={data.personal.email} defaultProtocol="mailto" />
                {data.personal.email.value && <span className="text-gray-400">&bull;</span>}
                 <ContactItem contactInfo={data.personal.email2} defaultProtocol="mailto" />
                {data.personal.email2.value && <span className="text-gray-400">&bull;</span>}
                <ContactItem contactInfo={data.personal.linkedin} />
            </div>

            <main className="w-full max-w-4xl mx-auto mt-8 text-left">
                <Section title="Resumen Profesional" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                    {parseAndStyleText(data.summary)}
                </Section>
                <Section title="Experiencia Laboral" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                    {data.experience.map(exp => (
                        <div key={exp.id} className="mb-4 item-wrapper">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-bold text-base">{exp.title}</h3>
                                <p className="text-sm font-light">{exp.date}</p>
                            </div>
                            <p className="italic text-sm mb-1">{exp.company}</p>
                            <div className="prose prose-sm max-w-none">{parseAndStyleText(exp.description)}</div>
                        </div>
                    ))}
                </Section>
                 <Section title="Logros Clave" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                    {parseAndStyleText(data.achievements)}
                </Section>
                <Section title="Fortalezas Clave" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                    {parseAndStyleText(data.strengths)}
                </Section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <Section title="Habilidades" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                         <SkillTags skills={data.skills} backgroundColor={skillBackgroundColor} textColor={skillTextColor} />
                    </Section>
                    <Section title="Educación" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                        {data.education.map(edu => (
                            <div key={edu.id} className="mb-2 item-wrapper">
                                <h3 className="font-bold">{edu.degree}</h3>
                                <p className="italic">{edu.school}</p>
                                <p className="text-xs">{edu.date}</p>
                            </div>
                        ))}
                    </Section>
                </div>
                {data.cta && (
                    <Section title="LLAMADA A LA ACCIÓN" borderColor={borderColor} sectionTitleColor={sectionTitleColor}>
                        <div className="text-center italic p-3 rounded-md" style={{ backgroundColor: skillBackgroundColor, color: skillTextColor }}>
                            {parseAndStyleText(data.cta)}
                        </div>
                    </Section>
                )}
            </main>
        </div>
    );
};


const CoverLetterPage: React.FC<ResumeTemplateProps> = ({ data }) => {
    const { coverLetterStyle } = data;
    const mainStyle: React.CSSProperties = {
        fontFamily: `'${coverLetterStyle.fontFamily}', serif`,
        fontSize: `${coverLetterStyle.fontSize}pt`,
        color: coverLetterStyle.textColor,
        lineHeight: 1.5,
    };

    return (
        <div style={{color: data.style.textColor}}>
            <header className="text-center mb-10">
                <h1 className="text-3xl font-bold font-slab">{data.personal.name}</h1>
                <p>{data.personal.title}</p>
                <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 text-sm mt-2">
                    <ContactItem contactInfo={data.personal.phone} defaultProtocol="tel" />
                    <ContactItem contactInfo={data.personal.phone2} defaultProtocol="tel" />
                    <span className="text-gray-400">|</span>
                    <ContactItem contactInfo={data.personal.email} defaultProtocol="mailto" />
                    <ContactItem contactInfo={data.personal.email2} defaultProtocol="mailto" />
                    <span className="text-gray-400">|</span>
                    <ContactItem contactInfo={data.personal.linkedin} />
                </div>
            </header>
            <main className="text-left" style={mainStyle}>
                {parseAndStyleText(data.coverLetter)}
            </main>
        </div>
    );
}

export const ResumeTemplate: React.FC<ResumeTemplateProps> = ({ data, isCoverLetter }) => {
  const pageStyle: React.CSSProperties = {
    backgroundColor: data.style.sheetColor,
    color: data.style.textColor,
    fontFamily: `'${data.style.fontFamily}', sans-serif`,
  };

  if (isCoverLetter) {
      return (
        <div className="resume-page" style={{ ...pageStyle, padding: '1.5cm' }}>
            <CoverLetterPage data={data} />
        </div>
      );
  }
  
  const LayoutComponent = {
    'minimalist': MinimalistLayout,
    'executive': DualColumnLayout,
    'creative': BannerLayout,
    'modern': DualColumnLayout,
    'technical': DualColumnLayout,
    'infographic': BannerLayout,
    'corporate': DualColumnLayout,
    'dual-column': DualColumnLayout,
    'centered': BannerLayout,
    'academic': DualColumnLayout,
    'banner': BannerLayout
  }[data.style.layout] || BannerLayout;
  
  return (
    <div className="resume-page" style={{...pageStyle, padding: '0'}}>
       <LayoutComponent data={data} />
    </div>
  );
};