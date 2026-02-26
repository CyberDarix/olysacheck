#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
╔═══════════════════════════════════════════════════════════════════╗
║         🗺️ OLYSACHECK - GÉNÉRATEUR DE SITEMAP ULTRA              ║
╠═══════════════════════════════════════════════════════════════════╣
║  Version: 2.0.0 - ULTRA OPTIMISÉ POUR GOOGLE                     ║
║  Auteur: OlysaCheck Security Team                                 ║
║  Description: Génère un sitemap.xml parfait pour le référencement ║
╚═══════════════════════════════════════════════════════════════════╝
"""

import os
import glob
from datetime import datetime
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom import minidom
import urllib.parse

# =============================================================
# 🎯 CONFIGURATION - MODIFIE CES VALEURS
# =============================================================

class SitemapConfig:
    # 🔗 URL de base de ton site (change si besoin)
    BASE_URL = "https://olysacheck.vercel.app"
    
    # 📁 Extensions de fichiers à inclure
    FILE_EXTENSIONS = ['*.html', '*.php']
    
    # 📝 Fichiers à exclure (si tu ne veux pas qu'ils soient indexés)
    EXCLUDED_FILES = [
        '404.html',
        'error.html',
        'thanks.html',
        'old/',
        'backup/'
    ]
    
    # 🏆 Priorités des pages (1.0 = très important, 0.1 = peu important)
    PAGE_PRIORITIES = {
        'index.html': 1.0,        # Page d'accueil : priorité MAXIMALE
        'auth.html': 0.8,          # Authentification
        'politique-confidentialite.html': 0.7,  # Page légale
        'check-email.php': 0.9,     # Fonctionnalité principale
    }
    
    # 🔄 Fréquence de mise à jour
    PAGE_FREQUENCY = {
        'index.html': 'daily',
        'auth.html': 'weekly',
        'politique-confidentialite.html': 'monthly',
        'check-email.php': 'daily',
    }
    
    # 📅 Date par défaut (si fichier non trouvé)
    DEFAULT_DATE = datetime.now().strftime("%Y-%m-%d")


# =============================================================
# 🚀 GÉNÉRATEUR DE SITEMAP INTELLIGENT
# =============================================================

class SmartSitemapGenerator:
    def __init__(self, config):
        self.config = config
        self.files_found = []
        self.sitemap = None
        self.stats = {
            'total_files': 0,
            'included': 0,
            'excluded': 0,
            'errors': 0
        }
        
    def scan_files(self):
        """Scan tous les fichiers HTML/PHP du dossier"""
        print("🔍 Scan des fichiers en cours...")
        
        for ext in self.config.FILE_EXTENSIONS:
            found = glob.glob(ext)
            self.files_found.extend(found)
        
        self.stats['total_files'] = len(self.files_found)
        print(f"   ✅ {self.stats['total_files']} fichiers trouvés")
        
    def should_exclude(self, filename):
        """Vérifie si un fichier doit être exclu"""
        for excluded in self.config.EXCLUDED_FILES:
            if excluded in filename:
                return True
        return False
    
    def get_file_info(self, filename):
        """Récupère les infos d'un fichier (taille, date modif)"""
        try:
            stat = os.stat(filename)
            return {
                'size': stat.st_size,
                'modified': datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d"),
                'exists': True
            }
        except:
            return {
                'size': 0,
                'modified': self.config.DEFAULT_DATE,
                'exists': False
            }
    
    def get_priority(self, filename):
        """Détermine la priorité d'une page"""
        return self.config.PAGE_PRIORITIES.get(filename, 0.5)
    
    def get_frequency(self, filename):
        """Détermine la fréquence de mise à jour"""
        return self.config.PAGE_FREQUENCY.get(filename, 'weekly')
    
    def generate_xml(self):
        """Génère le fichier XML du sitemap"""
        print("📝 Génération du XML...")
        
        # Création de la racine
        urlset = Element('urlset')
        urlset.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
        urlset.set('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
        urlset.set('xsi:schemaLocation', 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd')
        
        # Pour chaque fichier
        for filename in sorted(self.files_found):
            if self.should_exclude(filename):
                self.stats['excluded'] += 1
                continue
                
            file_info = self.get_file_info(filename)
            
            # Création de l'entrée URL
            url = SubElement(urlset, 'url')
            
            # Loc (URL complète)
            loc = SubElement(url, 'loc')
            encoded_filename = urllib.parse.quote(filename)
            loc.text = f"{self.config.BASE_URL}/{encoded_filename}"
            
            # Lastmod (dernière modification)
            lastmod = SubElement(url, 'lastmod')
            lastmod.text = file_info['modified']
            
            # Changefreq (fréquence)
            changefreq = SubElement(url, 'changefreq')
            changefreq.text = self.get_frequency(filename)
            
            # Priority (priorité)
            priority = SubElement(url, 'priority')
            priority.text = f"{self.get_priority(filename):.1f}"
            
            self.stats['included'] += 1
            
        # Conversion en XML propre
        rough_string = tostring(urlset, 'utf-8')
        reparsed = minidom.parseString(rough_string)
        xml_string = reparsed.toprettyxml(indent="  ", encoding='utf-8')
        
        return xml_string
    
    def save_sitemap(self, xml_content):
        """Sauvegarde le sitemap dans un fichier"""
        try:
            with open('sitemap.xml', 'wb') as f:
                f.write(xml_content)
            print(f"✅ Fichier sitemap.xml sauvegardé ({len(xml_content)} octets)")
            return True
        except Exception as e:
            print(f"❌ Erreur lors de la sauvegarde : {e}")
            return False
    
    def generate_robotstxt(self):
        """Génère un fichier robots.txt associé"""
        robots_content = f"""# robots.txt pour OlysaCheck
# Généré automatiquement le {datetime.now().strftime("%d/%m/%Y")}

User-agent: *
Allow: /
Disallow: /api/
Disallow: /private/
Disallow: /temp/

Sitemap: {self.config.BASE_URL}/sitemap.xml

# Délai d'exploration pour les robots (respectueux)
Crawl-delay: 1
"""
        try:
            with open('robots.txt', 'w', encoding='utf-8') as f:
                f.write(robots_content)
            print("✅ Fichier robots.txt sauvegardé")
            return True
        except Exception as e:
            print(f"❌ Erreur robots.txt : {e}")
            return False
    
    def show_stats(self):
        """Affiche les statistiques"""
        print("\n" + "="*50)
        print("📊 STATISTIQUES DE GÉNÉRATION")
        print("="*50)
        print(f"📁 Fichiers trouvés      : {self.stats['total_files']}")
        print(f"✅ Fichiers inclus        : {self.stats['included']}")
        print(f"⏭️  Fichiers exclus        : {self.stats['excluded']}")
        print(f"❌ Erreurs                 : {self.stats['errors']}")
        print("="*50)
        print(f"🌐 URL de base            : {self.config.BASE_URL}")
        print(f"📅 Date de génération      : {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        print("="*50)
        
    def validate_sitemap(self):
        """Valide le sitemap généré"""
        print("\n🔍 Validation du sitemap...")
        
        try:
            with open('sitemap.xml', 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Vérifications basiques
            if 'urlset' not in content:
                print("⚠️  Format XML invalide")
                return False
                
            url_count = content.count('<url>')
            if url_count == 0:
                print("⚠️  Aucune URL trouvée")
                return False
                
            print(f"✅ Sitemap valide avec {url_count} URLs")
            return True
            
        except Exception as e:
            print(f"❌ Erreur de validation : {e}")
            return False
    
    def run(self):
        """Exécute tout le processus"""
        print("""
╔══════════════════════════════════════════════════════════════╗
║     🚀 GÉNÉRATION DU SITEMAP POUR OLYSACHECK DÉMARRÉE       ║
╚══════════════════════════════════════════════════════════════╝
        """)
        
        # Scan des fichiers
        self.scan_files()
        
        # Génération du XML
        xml_content = self.generate_xml()
        
        # Sauvegarde
        if self.save_sitemap(xml_content):
            print("✅ Sitemap généré avec succès !")
        else:
            print("❌ Échec de la génération")
            self.stats['errors'] += 1
        
        # Génération du robots.txt
        self.generate_robotstxt()
        
        # Validation
        self.validate_sitemap()
        
        # Statistiques
        self.show_stats()
        
        print("""
╔══════════════════════════════════════════════════════════════╗
║     ✅ GÉNÉRATION TERMINÉE AVEC SUCCÈS !                    ║
║     📁 Fichiers créés :                                      ║
║        - sitemap.xml                                         ║
║        - robots.txt                                          ║
║     🌐 À soumettre à Google :                                ║
║        https://search.google.com/search-console             ║
╚══════════════════════════════════════════════════════════════╝
        """)


# =============================================================
# 🚀 POINT D'ENTRÉE PRINCIPAL
# =============================================================

if __name__ == "__main__":
    generator = SmartSitemapGenerator(SitemapConfig)
    generator.run()