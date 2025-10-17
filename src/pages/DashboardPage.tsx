import React from 'react'
import { useAccount } from 'wagmi'
import { LayoutDashboard, Plus, TrendingUp, Wallet, DollarSign, Activity, Zap, Target, Award, Eye } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ProjectCard } from '../components/project/ProjectCard'
import { Link } from 'react-router-dom'
import ExhibitionFormatters from '../utils/exFormatters'
import { useUserProjects } from '@/hooks/pad/useUserProjects'

export const DashboardPage: React.FC = () => {
  const { isConnected} = useAccount()
  
  // Use the new hook that fetches everything
  const {
    userProjects,
    userContributions,
    totalRaised,
    isLoading,
  } = useUserProjects()

  if (!isConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-8 bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-blue)]/30">
          <div className="space-y-6">
            <div className="relative">
              <Wallet className="h-16 w-16 mx-auto drop-shadow-[0_0_12px_var(--neon-blue)]" style={{ color: 'var(--neon-blue)' }} />
              <div className="absolute -inset-4 bg-gradient-to-r from-[var(--neon-blue)]/20 to-[var(--neon-orange)]/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--silver-light)' }}>
                Connect Your Wallet
              </h2>
              <p style={{ color: 'var(--metallic-silver)' }}>
                Connect your wallet to access your personalized dashboard and manage your projects
              </p>
            </div>
            <div className="bg-gradient-to-r from-[var(--neon-blue)]/10 to-[var(--neon-orange)]/10 p-4 rounded-lg">
              <w3m-button />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-[var(--charcoal)]/60 to-[var(--deep-black)]/60 p-6 rounded-xl border border-[var(--metallic-silver)]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <LayoutDashboard 
                className="h-10 w-10 drop-shadow-[0_0_8px_var(--neon-blue)]" 
                style={{ color: 'var(--neon-blue)' }}
              />
              <div className="absolute -inset-2 bg-[var(--neon-blue)]/20 rounded-full blur-sm"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--silver-light)' }}>
                Dashboard
              </h1>
              <p style={{ color: 'var(--metallic-silver)' }}>
                Manage your projects and track your contributions
              </p>
            </div>
          </div>
          
          <Link to="/create">
            <Button className="bg-gradient-to-r from-[var(--neon-orange)]/80 to-[var(--neon-orange)] hover:from-[var(--neon-orange)] hover:to-[var(--neon-orange)]/80 border-[var(--neon-orange)] shadow-lg shadow-[var(--neon-orange)]/30 transition-all duration-300">
              <Plus className="h-5 w-5 mr-2 drop-shadow-[0_0_4px_currentColor]" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-blue)]/40 transition-all duration-300 hover:border-[var(--neon-blue)]/60 hover:shadow-lg hover:shadow-[var(--neon-blue)]/20">
          <div className="text-center space-y-4 p-6">
            <div className="relative">
              <TrendingUp 
                className="h-10 w-10 mx-auto drop-shadow-[0_0_8px_var(--neon-blue)]" 
                style={{ color: 'var(--neon-blue)' }}
              />
              <div className="absolute -inset-3 bg-[var(--neon-blue)]/10 rounded-full blur-md"></div>
            </div>
            <div>
              <p className="text-3xl font-bold mb-1" style={{ color: 'var(--silver-light)' }}>
                {userProjects?.length || 0}
              </p>
              <p className="text-sm" style={{ color: 'var(--metallic-silver)' }}>
                Your Projects
              </p>
            </div>
            <div className="w-full bg-[var(--charcoal)] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-blue)]/70 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((userProjects?.length || 0) * 20, 100)}%` }}
              ></div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-orange)]/40 transition-all duration-300 hover:border-[var(--neon-orange)]/60 hover:shadow-lg hover:shadow-[var(--neon-orange)]/20">
          <div className="text-center space-y-4 p-6">
            <div className="relative">
              <Activity 
                className="h-10 w-10 mx-auto drop-shadow-[0_0_8px_var(--neon-orange)]" 
                style={{ color: 'var(--neon-orange)' }}
              />
              <div className="absolute -inset-3 bg-[var(--neon-orange)]/10 rounded-full blur-md"></div>
            </div>
            <div>
              <p className="text-3xl font-bold mb-1" style={{ color: 'var(--silver-light)' }}>
                {userContributions?.length || 0}
              </p>
              <p className="text-sm" style={{ color: 'var(--metallic-silver)' }}>
                Contributions Made
              </p>
            </div>
            <div className="w-full bg-[var(--charcoal)] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-orange)]/70 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((userContributions?.length || 0) * 25, 100)}%` }}
              ></div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--metallic-silver)]/40 transition-all duration-300 hover:border-[var(--metallic-silver)]/60 hover:shadow-lg hover:shadow-[var(--metallic-silver)]/10">
          <div className="text-center space-y-4 p-6">
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-[var(--neon-blue)]/10 to-[var(--neon-orange)]/10 rounded-full blur-md"></div>
              <div className="relative z-10 w-10 h-10 bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] rounded-full mx-auto flex items-center justify-center drop-shadow-[0_0_8px_var(--neon-blue)]">
                <DollarSign className="h-6 w-6 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold mb-1" style={{ color: 'var(--silver-light)' }}>
                ${totalRaised.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm" style={{ color: 'var(--metallic-silver)' }}>
                Total Raised
              </p>
            </div>
            <div className="w-full bg-[var(--charcoal)] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(totalRaised / 1000 * 10, 100)}%` }}
              ></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Your Projects Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target 
              className="h-6 w-6 drop-shadow-[0_0_6px_var(--neon-blue)]" 
              style={{ color: 'var(--neon-blue)' }}
            />
            <h2 className="text-2xl font-bold" style={{ color: 'var(--silver-light)' }}>
              Your Projects
            </h2>
          </div>
          {userProjects && userProjects.length > 0 && (
            <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--metallic-silver)' }}>
              <div className="w-2 h-2 rounded-full bg-[var(--neon-blue)] animate-pulse"></div>
              <span>{userProjects.length} Active</span>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <LoadingSpinner size="lg" />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--neon-blue)]/20 to-[var(--neon-orange)]/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <p style={{ color: 'var(--metallic-silver)' }}>Loading your projects...</p>
          </div>
        ) : userProjects && userProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProjects.map((project, index) => (
              <div 
                key={project.id.toString()}
                className="transform transition-all duration-300 hover:scale-[1.02]"
                style={{
                  animationDelay: `${index * 150}ms`
                }}
              >
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 bg-gradient-to-br from-[var(--charcoal)]/60 to-[var(--deep-black)]/60 border border-[var(--neon-orange)]/30">
            <div className="space-y-6">
              <Zap 
                className="h-16 w-16 mx-auto opacity-50" 
                style={{ color: 'var(--metallic-silver)' }}
              />
              <div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--silver-light)' }}>
                  Ready to Launch?
                </h3>
                <p className="mb-6 max-w-md mx-auto" style={{ color: 'var(--metallic-silver)' }}>
                  You haven't created any projects yet. Start your journey by launching your first token project.
                </p>
              </div>
              <Link to="/create">
                <Button className="bg-gradient-to-r from-[var(--neon-orange)]/80 to-[var(--neon-orange)] hover:from-[var(--neon-orange)] hover:to-[var(--neon-orange)]/80 border-[var(--neon-orange)] shadow-lg shadow-[var(--neon-orange)]/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </section>

      {/* Enhanced Your Contributions Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Award 
              className="h-6 w-6 drop-shadow-[0_0_6px_var(--neon-orange)]" 
              style={{ color: 'var(--neon-orange)' }}
            />
            <h2 className="text-2xl font-bold" style={{ color: 'var(--silver-light)' }}>
              Your Contributions
            </h2>
          </div>
          {userContributions && userContributions.length > 0 && (
            <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--metallic-silver)' }}>
              <div className="w-2 h-2 rounded-full bg-[var(--neon-orange)] animate-pulse"></div>
              <span>{userContributions.length} Active</span>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <LoadingSpinner size="lg" />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--neon-orange)]/20 to-[var(--neon-blue)]/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <p style={{ color: 'var(--metallic-silver)' }}>Loading your contributions...</p>
          </div>
        ) : userContributions && userContributions.length > 0 ? (
          <div className="space-y-4">
            {userContributions.map(({ projectId, amount }, index) => (
              <Card 
                key={projectId}
                className="bg-gradient-to-r from-[var(--charcoal)]/80 to-[var(--deep-black)]/80 border border-[var(--neon-orange)]/30 transition-all duration-300 hover:border-[var(--neon-orange)]/50 hover:shadow-lg hover:shadow-[var(--neon-orange)]/10"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-orange)]/70 drop-shadow-[0_0_4px_var(--neon-orange)]"></div>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--silver-light)' }}>
                        Project #{projectId}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--metallic-silver)' }}>
                        Contributed: {ExhibitionFormatters.formatLargeNumber(BigInt(amount), 18, 2)} tokens
                      </p>
                    </div>
                  </div>
                  <Link to={`/projects/${projectId}`}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-[var(--neon-orange)]/50 hover:bg-[var(--neon-orange)]/10 hover:border-[var(--neon-orange)] transition-all duration-300"
                      style={{ color: 'var(--silver-light)' }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Project
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 bg-gradient-to-br from-[var(--charcoal)]/60 to-[var(--deep-black)]/60 border border-[var(--neon-blue)]/30">
            <div className="space-y-6">
              <Target 
                className="h-16 w-16 mx-auto opacity-50" 
                style={{ color: 'var(--metallic-silver)' }}
              />
              <div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--silver-light)' }}>
                  Start Contributing
                </h3>
                <p className="mb-6 max-w-md mx-auto" style={{ color: 'var(--metallic-silver)' }}>
                  You haven't contributed to any projects yet. Explore innovative projects and support the ecosystem.
                </p>
              </div>
              <Link to="/projects">
                <Button 
                  variant="outline"
                  className="border-[var(--neon-blue)]/50 hover:bg-[var(--neon-blue)]/10 hover:border-[var(--neon-blue)] transition-all duration-300"
                  style={{ color: 'var(--silver-light)' }}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Explore Projects
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </section>
    </div>
  )
}