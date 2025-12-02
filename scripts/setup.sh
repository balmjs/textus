#!/bin/bash

# Textus Setup Script
# This script helps you set up Textus quickly

set -e

echo "Textus Setup"
echo "================="
echo ""

# Check for required tools
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

if ! command -v turso &> /dev/null; then
    echo "❌ Turso CLI is not installed."
    echo "📥 Installing Turso CLI..."
    curl -sSfL https://get.tur.so/install.sh | bash
    echo "✅ Turso CLI installed. Please restart your terminal and run this script again."
    exit 0
fi

echo "✅ All prerequisites met"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists. Skipping environment setup."
else
    echo "📝 Setting up environment..."
    cp .env.example .env

    echo ""
    echo "🔑 Turso Database Setup"
    echo "----------------------"

    read -p "Do you want to create a new Turso database? (y/n) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔐 Logging into Turso..."
        turso auth login

        read -p "Enter database name (default: textus): " db_name
        db_name=${db_name:-textus}

        echo "📊 Creating database: $db_name..."
        turso db create $db_name

        echo "🔗 Getting database URL..."
        db_url=$(turso db show $db_name --url)

        echo "🎫 Generating auth token..."
        db_token=$(turso db tokens create $db_name)

        # Update .env file
        sed -i.bak "s|TURSO_DATABASE_URL=.*|TURSO_DATABASE_URL=$db_url|" .env
        sed -i.bak "s|TURSO_AUTH_TOKEN=.*|TURSO_AUTH_TOKEN=$db_token|" .env
        rm .env.bak 2>/dev/null || true

        echo "✅ Database configuration saved to .env"
    else
        echo "⚠️  Please manually configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env"
    fi

    echo ""
    echo "🔐 Admin Password Setup"
    echo "----------------------"

    read -p "Enter admin username (default: admin): " admin_user
    admin_user=${admin_user:-admin}

    read -s -p "Enter admin password: " admin_pass
    echo

    if [ -z "$admin_pass" ]; then
        echo "❌ Password cannot be empty"
        exit 1
    fi

    echo "🔒 Generating password hash..."
    password_hash=$(node -e "console.log(require('bcryptjs').hashSync('$admin_pass', 10))")

    # Generate random JWT secret
    jwt_secret=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

    # Update .env file
    sed -i.bak "s|AUTH_USERNAME=.*|AUTH_USERNAME=$admin_user|" .env
    sed -i.bak "s|AUTH_PASSWORD=.*|AUTH_PASSWORD=$password_hash|" .env
    sed -i.bak "s|AUTH_SECRET=.*|AUTH_SECRET=$jwt_secret|" .env
    rm .env.bak 2>/dev/null || true

    echo "✅ Admin credentials saved to .env"
fi

echo ""
echo "🗄️  Database Migrations"
echo "----------------------"

if [ -f .env ]; then
    read -p "Run database migrations now? (y/n) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📊 Generating migrations..."
        pnpm db:generate

        echo "🚀 Running migrations..."
        pnpm db:migrate

        echo "✅ Database migrations complete"

        read -p "Add sample data? (y/n) " -n 1 -r
        echo

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "📝 Adding sample data..."
            turso db shell $(grep TURSO_DATABASE_URL .env | cut -d '=' -f2) < scripts/seed-data.sql
            echo "✅ Sample data added"
        fi
    fi
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Review and adjust .env configuration"
echo "2. Start development server: pnpm dev"
echo "3. Visit http://localhost:5173"
echo "4. Login with your admin credentials"
echo ""
echo "📚 Documentation:"
echo "- README.md - Getting started guide"
echo "- DEPLOYMENT.md - How to deploy"
echo "- ARCHITECTURE.md - Technical details"
echo ""
echo "Happy coding! 🚀"
