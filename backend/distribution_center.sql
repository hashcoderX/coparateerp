-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 23, 2026 at 06:52 AM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `distribution_center`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `in_time` time DEFAULT NULL,
  `out_time` time DEFAULT NULL,
  `work_hours` decimal(5,2) DEFAULT NULL,
  `status` enum('present','absent','late','half_day') NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bom_headers`
--

CREATE TABLE `bom_headers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `version` varchar(30) NOT NULL DEFAULT 'v1',
  `batch_size` decimal(15,3) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bom_headers`
--

INSERT INTO `bom_headers` (`id`, `product_id`, `version`, `batch_size`, `is_active`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 'v1', '1.000', 1, NULL, '2026-04-19 12:09:34', '2026-04-19 12:09:34'),
(2, 2, 'v1', '100.000', 1, NULL, '2026-04-20 07:00:41', '2026-04-20 07:00:41');

-- --------------------------------------------------------

--
-- Table structure for table `bom_items`
--

CREATE TABLE `bom_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `bom_id` bigint(20) UNSIGNED NOT NULL,
  `material_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` decimal(15,4) NOT NULL,
  `unit` varchar(30) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bom_items`
--

INSERT INTO `bom_items` (`id`, `bom_id`, `material_id`, `quantity`, `unit`, `created_at`, `updated_at`) VALUES
(1, 1, 2, '10.0000', 'kg', '2026-04-19 12:09:34', '2026-04-19 12:09:34'),
(2, 1, 1, '1.0000', 'kg', '2026-04-19 12:09:34', '2026-04-19 12:09:34'),
(3, 2, 2, '2.0000', 'kg', '2026-04-20 07:00:41', '2026-04-20 07:00:41'),
(4, 2, 1, '0.2000', 'kg', '2026-04-20 07:00:41', '2026-04-20 07:00:41');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `candidates`
--

CREATE TABLE `candidates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `candidate_code` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `address` text DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `position_applied` varchar(255) NOT NULL,
  `cv_path` text DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `status` enum('applied','shortlisted','interviewed','selected','rejected','hired') NOT NULL DEFAULT 'applied',
  `interview_date` date DEFAULT NULL,
  `interview_time` time DEFAULT NULL,
  `interview_notes` text DEFAULT NULL,
  `appointment_letter_path` text DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `expected_salary` decimal(10,2) DEFAULT NULL,
  `offered_salary` decimal(10,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `candidate_documents`
--

CREATE TABLE `candidate_documents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `candidate_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `candidate_educations`
--

CREATE TABLE `candidate_educations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `candidate_id` bigint(20) UNSIGNED NOT NULL,
  `institution` varchar(255) NOT NULL,
  `degree` varchar(255) DEFAULT NULL,
  `field_of_study` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `grade` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `candidate_experiences`
--

CREATE TABLE `candidate_experiences` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `candidate_id` bigint(20) UNSIGNED NOT NULL,
  `company` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `responsibilities` text DEFAULT NULL,
  `achievements` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `candidate_interviewers`
--

CREATE TABLE `candidate_interviewers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `candidate_id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `candidate_interviews`
--

CREATE TABLE `candidate_interviews` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `candidate_id` bigint(20) UNSIGNED NOT NULL,
  `interview_date` date NOT NULL,
  `interview_time` time NOT NULL,
  `interview_notes` text DEFAULT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `result` enum('pending','pass','fail') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `candidate_interview_participants`
--

CREATE TABLE `candidate_interview_participants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `candidate_interview_id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cheque_registry_entries`
--

CREATE TABLE `cheque_registry_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `company_cheque_account_id` bigint(20) UNSIGNED DEFAULT NULL,
  `distribution_payment_id` bigint(20) UNSIGNED DEFAULT NULL,
  `direction` enum('received','issued') NOT NULL,
  `lifecycle_status` enum('registered','deposited','cleared','bounced','issued') NOT NULL DEFAULT 'registered',
  `source_module` enum('manual','distribution','supplier_payment') NOT NULL DEFAULT 'manual',
  `cheque_no` varchar(100) NOT NULL,
  `cheque_date` date DEFAULT NULL,
  `deposit_date` date DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `bank_name` varchar(255) DEFAULT NULL,
  `account_no` varchar(100) DEFAULT NULL,
  `counterparty_name` varchar(255) DEFAULT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cheque_registry_entries`
--

INSERT INTO `cheque_registry_entries` (`id`, `company_id`, `company_cheque_account_id`, `distribution_payment_id`, `direction`, `lifecycle_status`, `source_module`, `cheque_no`, `cheque_date`, `deposit_date`, `amount`, `bank_name`, `account_no`, `counterparty_name`, `reference_no`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 2, NULL, 2, 'received', 'deposited', 'distribution', '90889888', '2026-04-30', '2026-04-19', '220.00', 'HNB Bank', '005909899', 'GNK Stores', '90889888', 'Handed over from distribution payment PAY-20260419-889', 1, '2026-04-19 04:52:37', '2026-04-19 06:40:36'),
(2, 2, NULL, 1, 'received', 'cleared', 'distribution', '90009090', '2026-04-19', '2026-04-19', '1100.00', 'BOC Bank', '005909899', 'GNK Stores', '90009090', 'KL90089 | Ended cheque process from registry action | End clearance completed on 2026-04-19 12:08:36', 1, '2026-04-19 04:54:38', '2026-04-19 06:38:36');

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `country` varchar(255) NOT NULL DEFAULT 'Sri Lanka',
  `currency` varchar(10) NOT NULL DEFAULT 'LKR',
  `logo_path` varchar(255) DEFAULT NULL,
  `current_cash_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `current_bank_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `bank_name` varchar(255) DEFAULT NULL,
  `bank_account_no` varchar(100) DEFAULT NULL,
  `current_cheque_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `name`, `email`, `address`, `phone`, `website`, `country`, `currency`, `logo_path`, `current_cash_balance`, `current_bank_balance`, `bank_name`, `bank_account_no`, `current_cheque_balance`, `created_at`, `updated_at`) VALUES
(2, 'Pabasara Sweets', 'pabasarasweets@gmail.com', NULL, '0712323223', NULL, 'Sri Lanka', 'LKR', 'company-logos/tOaEnM7xFubdTlvNnqZZiyl29PggB4zPjse0AIMV.png', '500000.00', '1211320.00', 'BOC Bank Eheliyagoda', '005909899', '0.00', '2026-04-18 02:09:12', '2026-04-21 22:26:37');

-- --------------------------------------------------------

--
-- Table structure for table `company_bank_accounts`
--

CREATE TABLE `company_bank_accounts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `bank_name` varchar(255) NOT NULL,
  `account_no` varchar(100) NOT NULL,
  `current_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `company_bank_accounts`
--

INSERT INTO `company_bank_accounts` (`id`, `company_id`, `bank_name`, `account_no`, `current_balance`, `created_at`, `updated_at`) VALUES
(21, 2, 'BOC Bank Eheliyagoda', '005909899', '511320.00', '2026-04-21 22:26:37', '2026-04-21 22:26:37'),
(22, 2, 'HNB Bank Eheliyagoda', '900099889', '700000.00', '2026-04-21 22:26:37', '2026-04-21 22:26:37');

-- --------------------------------------------------------

--
-- Table structure for table `company_cheque_accounts`
--

CREATE TABLE `company_cheque_accounts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `bank_name` varchar(255) NOT NULL,
  `account_no` varchar(100) NOT NULL,
  `current_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `company_cheque_accounts`
--

INSERT INTO `company_cheque_accounts` (`id`, `company_id`, `bank_name`, `account_no`, `current_balance`, `created_at`, `updated_at`) VALUES
(11, 2, 'BOC Bank Eheliyagoda', '005909899', '0.00', '2026-04-21 22:26:37', '2026-04-21 22:26:37');

-- --------------------------------------------------------

--
-- Table structure for table `delivery_cash_transactions`
--

CREATE TABLE `delivery_cash_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `type` enum('in','out') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `delivery_cash_transactions`
--

INSERT INTO `delivery_cash_transactions` (`id`, `date`, `type`, `amount`, `reference`, `note`, `created_by`, `created_at`, `updated_at`) VALUES
(2, '2026-04-19', 'in', '50000.00', 'uui', 'Fund transfer received. Dr Delivery Cash Account, Cr Cash Account.', 1, '2026-04-18 23:23:34', '2026-04-18 23:23:34'),
(3, '2026-04-19', 'out', '9000.00', 'LDEX-1-1776618999121', 'Load Expense [LOAD:1] [EXP:fuel] Fual | VL-2026-001', 1, '2026-04-19 11:46:41', '2026-04-19 11:46:41'),
(4, '2026-04-19', 'out', '7500.00', 'LDEX-1-1776619341841', 'Fuel Refill', 1, '2026-04-19 11:52:22', '2026-04-19 11:52:22');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `tenant_id`, `branch_id`, `name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(2, 2, 2, 'Production Department', 'Production Department', 1, '2026-04-18 02:10:06', '2026-04-18 02:10:06'),
(3, 2, 2, 'Quality Control (QC)', 'Quality Control (QC)', 1, '2026-04-18 02:10:23', '2026-04-18 02:10:23'),
(4, 2, 2, 'Warehouse / Stores', 'Warehouse / Stores', 1, '2026-04-18 02:10:38', '2026-04-18 02:10:38'),
(5, 2, 2, 'Distribution / Logistics', 'Distribution / Logistics', 1, '2026-04-18 02:10:50', '2026-04-18 02:10:50'),
(6, 2, 2, 'HR (Human Resources)', 'HR (Human Resources)', 1, '2026-04-18 02:11:02', '2026-04-18 02:11:02'),
(7, 2, 2, 'Finance / Accounts', 'Finance / Accounts', 1, '2026-04-18 02:11:19', '2026-04-18 02:11:19'),
(8, 2, 2, 'Administration', 'Administration', 1, '2026-04-18 02:29:19', '2026-04-18 02:29:19');

-- --------------------------------------------------------

--
-- Table structure for table `designations`
--

CREATE TABLE `designations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `salary_range_min` decimal(10,2) DEFAULT NULL,
  `salary_range_max` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `designations`
--

INSERT INTO `designations` (`id`, `tenant_id`, `branch_id`, `name`, `description`, `salary_range_min`, `salary_range_max`, `is_active`, `created_at`, `updated_at`) VALUES
(3, 2, 2, 'Admin/Owner', 'Auto-created from role selection', NULL, NULL, 1, '2026-04-18 03:48:59', '2026-04-18 03:48:59'),
(4, 2, 2, 'Sales Person', 'Auto-created from role selection', NULL, NULL, 1, '2026-04-18 03:56:13', '2026-04-18 03:56:13'),
(5, 2, 2, 'Driver', 'Auto-created from role selection', NULL, NULL, 1, '2026-04-18 03:58:20', '2026-04-18 03:58:20');

-- --------------------------------------------------------

--
-- Table structure for table `distribution_customers`
--

CREATE TABLE `distribution_customers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shop_name` varchar(255) NOT NULL,
  `customer_code` varchar(50) NOT NULL,
  `owner_name` varchar(255) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `route_id` bigint(20) UNSIGNED DEFAULT NULL,
  `outstanding` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `distribution_customers`
--

INSERT INTO `distribution_customers` (`id`, `shop_name`, `customer_code`, `owner_name`, `phone`, `email`, `address`, `route_id`, `outstanding`, `status`, `created_at`, `updated_at`) VALUES
(1, 'GNK Stores', 'CUS-260419145620-191', 'Gamini Karunarathna', '0712323223', NULL, NULL, 1, '0.00', 'active', '2026-04-19 03:56:50', '2026-04-19 03:56:50');

-- --------------------------------------------------------

--
-- Table structure for table `distribution_invoices`
--

CREATE TABLE `distribution_invoices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `invoice_number` varchar(60) NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `load_id` bigint(20) UNSIGNED DEFAULT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('pending','partial','paid','cancelled') NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `distribution_invoices`
--

INSERT INTO `distribution_invoices` (`id`, `invoice_number`, `customer_id`, `load_id`, `invoice_date`, `due_date`, `subtotal`, `discount`, `total`, `paid_amount`, `status`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'INV-20260419-269', 1, 1, '2026-04-19', '2026-04-30', '1100.00', '0.00', '1100.00', '1100.00', 'paid', '[INVOICE LINES]\nLine breakdown:\n- 10.00 paid + 0.00 free x Flover (RM-FLOVER-001) @ base 110.00, disc/unit 0.00, effective 110.00 => paid total 1100.00\n[PAYMENT EVIDENCE]\nPayment mode: CHECK\nAmount paid: 1100.00\nPayment date: 2026-04-19\nReference: 90009090', 3, '2026-04-19 03:59:09', '2026-04-19 03:59:10'),
(2, 'INV-20260419-835', 1, 1, '2026-04-19', '2026-04-19', '220.00', '0.00', '220.00', '220.00', 'paid', '[INVOICE LINES]\nLine breakdown:\n- 2.00 paid + 0.00 free x Flover (RM-FLOVER-001) @ base 110.00, disc/unit 0.00, effective 110.00 => paid total 220.00\n[PAYMENT EVIDENCE]\nPayment mode: CHECK\nAmount paid: 220.00\nPayment date: 2026-04-30\nCheque date: 2026-04-30\nReference: 90889888', 3, '2026-04-19 04:12:23', '2026-04-19 04:12:24');

-- --------------------------------------------------------

--
-- Table structure for table `distribution_invoice_items`
--

CREATE TABLE `distribution_invoice_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `distribution_invoice_id` bigint(20) UNSIGNED NOT NULL,
  `load_id` bigint(20) UNSIGNED DEFAULT NULL,
  `inventory_item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `item_code` varchar(80) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `unit` varchar(30) DEFAULT NULL,
  `quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `unit_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `line_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `distribution_invoice_items`
--

INSERT INTO `distribution_invoice_items` (`id`, `distribution_invoice_id`, `load_id`, `inventory_item_id`, `item_code`, `item_name`, `unit`, `quantity`, `unit_price`, `discount`, `line_total`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 2, 'RM-FLOVER-001', 'Flover', 'kg', '10.00', '110.00', '0.00', '1100.00', '2026-04-19 03:59:09', '2026-04-19 03:59:09'),
(2, 2, 1, 2, 'RM-FLOVER-001', 'Flover', 'kg', '2.00', '110.00', '0.00', '220.00', '2026-04-19 04:12:23', '2026-04-19 04:12:23');

-- --------------------------------------------------------

--
-- Table structure for table `distribution_payments`
--

CREATE TABLE `distribution_payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `payment_number` varchar(60) NOT NULL,
  `distribution_invoice_id` bigint(20) UNSIGNED DEFAULT NULL,
  `load_id` bigint(20) UNSIGNED DEFAULT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `payment_date` date NOT NULL,
  `cheque_date` date DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `payment_method` enum('check','cash','bank_transfer') NOT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `status` enum('received','cleared','bounced','pending') NOT NULL DEFAULT 'received',
  `notes` text DEFAULT NULL,
  `received_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `distribution_payments`
--

INSERT INTO `distribution_payments` (`id`, `payment_number`, `distribution_invoice_id`, `load_id`, `customer_id`, `payment_date`, `cheque_date`, `amount`, `payment_method`, `reference_no`, `bank_name`, `status`, `notes`, `received_by`, `created_at`, `updated_at`) VALUES
(1, 'PAY-20260419-911', 1, 1, 1, '2026-04-19', NULL, '1100.00', 'check', '90009090', 'BOC Bank', 'cleared', 'Auto payment from invoice INV-20260419-269', 3, '2026-04-19 03:59:10', '2026-04-19 06:38:36'),
(2, 'PAY-20260419-889', 2, 1, 1, '2026-04-30', '2026-04-30', '220.00', 'check', '90889888', 'HNB Bank', 'cleared', 'Auto payment from invoice INV-20260419-835', 3, '2026-04-19 04:12:24', '2026-04-19 06:40:36');

-- --------------------------------------------------------

--
-- Table structure for table `distribution_returns`
--

CREATE TABLE `distribution_returns` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `return_number` varchar(60) NOT NULL,
  `distribution_invoice_id` bigint(20) UNSIGNED DEFAULT NULL,
  `load_id` bigint(20) UNSIGNED DEFAULT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `returned_inventory_item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `return_date` date NOT NULL,
  `total_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `settlement_type` enum('bill_deduction','cash_refund','item_exchange') NOT NULL DEFAULT 'bill_deduction',
  `settlement_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `exchange_inventory_item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `exchange_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `reason` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `employee_code` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mobile` varchar(255) NOT NULL,
  `nic_passport` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `department_id` bigint(20) UNSIGNED NOT NULL,
  `designation_id` bigint(20) UNSIGNED NOT NULL,
  `join_date` date NOT NULL,
  `basic_salary` decimal(10,2) NOT NULL,
  `commission` decimal(5,2) DEFAULT NULL,
  `commission_base` enum('company_profit','own_business') DEFAULT NULL,
  `overtime_payment_per_hour` decimal(8,2) DEFAULT NULL,
  `deduction_late_hour` decimal(8,2) DEFAULT NULL,
  `epf_employee_contribution` decimal(5,2) DEFAULT NULL,
  `epf_employer_contribution` decimal(5,2) DEFAULT NULL,
  `etf_employee_contribution` decimal(5,2) DEFAULT NULL,
  `etf_employer_contribution` decimal(5,2) DEFAULT NULL,
  `tin` varchar(255) DEFAULT NULL,
  `tax_applicable` tinyint(1) NOT NULL DEFAULT 0,
  `tax_relief_eligible` tinyint(1) NOT NULL DEFAULT 0,
  `apit_tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `apit_tax_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `employee_type` enum('full_time','part_time','contract') NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `tenant_id`, `branch_id`, `employee_code`, `first_name`, `last_name`, `email`, `mobile`, `nic_passport`, `address`, `photo_path`, `date_of_birth`, `gender`, `department_id`, `designation_id`, `join_date`, `basic_salary`, `commission`, `commission_base`, `overtime_payment_per_hour`, `deduction_late_hour`, `epf_employee_contribution`, `epf_employer_contribution`, `etf_employee_contribution`, `etf_employer_contribution`, `tin`, `tax_applicable`, `tax_relief_eligible`, `apit_tax_amount`, `apit_tax_rate`, `employee_type`, `status`, `deleted_at`, `created_at`, `updated_at`) VALUES
(2, 2, 2, 'EMP0001', 'Pabasara', 'Ranathunga', 'pabasararana@gmail.com', '0712345446', 'TEMP1776504150', 'Eheliyagoda', '—Pngtree—hindu new year gudipada red_6046424.png', '1993-03-03', 'other', 8, 3, '2026-04-18', '50000.00', '30.00', 'company_profit', '0.00', '0.00', '8.00', '12.00', '0.00', '3.00', '121', 1, 1, '0.00', '0.00', 'full_time', 'active', NULL, '2026-04-18 03:52:30', '2026-04-18 03:52:30'),
(3, 2, 2, 'EMP0002', 'Rangana', 'Sampath', 'rangana@gmail.com', '0713434223', 'TEMP1776504373', 'Eheliyagoda', NULL, '1998-09-09', 'other', 5, 4, '2026-04-18', '50000.00', '0.00', NULL, '90.00', '90.00', '8.00', '12.00', '0.00', '3.00', '120', 0, 0, '0.00', '0.00', 'full_time', 'active', NULL, '2026-04-18 03:56:13', '2026-04-18 03:56:13'),
(4, 2, 2, 'EMP0003', 'Saman', 'Sanjeewa', 'saman@gmail.com', '0715656776', 'TEMP1776504500', 'Eheliyagoda', NULL, '1990-03-03', 'other', 5, 5, '2026-04-18', '34000.00', '5.50', 'own_business', '0.00', '0.00', '8.00', '12.00', '0.00', '3.00', '122', 0, 0, '0.00', '0.00', 'full_time', 'active', NULL, '2026-04-18 03:58:20', '2026-04-18 03:58:20');

-- --------------------------------------------------------

--
-- Table structure for table `employee_allowances_deductions`
--

CREATE TABLE `employee_allowances_deductions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('allowance','deduction') NOT NULL,
  `amount_type` enum('fixed','percentage') NOT NULL DEFAULT 'fixed',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_documents`
--

CREATE TABLE `employee_documents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_educations`
--

CREATE TABLE `employee_educations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `institution` varchar(255) NOT NULL,
  `degree` varchar(255) DEFAULT NULL,
  `field_of_study` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `grade` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_experiences`
--

CREATE TABLE `employee_experiences` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `company` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `responsibilities` text DEFAULT NULL,
  `achievements` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `goods_received_notes`
--

CREATE TABLE `goods_received_notes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `grn_number` varchar(255) NOT NULL,
  `purchase_order_id` bigint(20) UNSIGNED NOT NULL,
  `received_date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('draft','received','inspected','approved','rejected') NOT NULL DEFAULT 'draft',
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `net_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `payment_status` enum('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
  `payment_timing` enum('post_payment','on_time') NOT NULL DEFAULT 'post_payment',
  `payment_type` varchar(255) DEFAULT NULL,
  `payment_reference` varchar(255) DEFAULT NULL,
  `paid_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `paid_at` datetime DEFAULT NULL,
  `payment_note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `goods_received_notes`
--

INSERT INTO `goods_received_notes` (`id`, `grn_number`, `purchase_order_id`, `received_date`, `notes`, `status`, `total_amount`, `discount_amount`, `net_amount`, `payment_status`, `payment_timing`, `payment_type`, `payment_reference`, `paid_amount`, `paid_at`, `payment_note`, `created_at`, `updated_at`) VALUES
(1, 'GRN20260001', 1, '2026-04-18', NULL, 'received', '0.00', '0.00', '0.00', 'unpaid', 'post_payment', NULL, NULL, '0.00', NULL, NULL, '2026-04-18 05:05:38', '2026-04-18 05:05:38'),
(2, 'GRN20260002', 2, '2026-04-18', NULL, 'received', '40000.00', '0.00', '40000.00', 'unpaid', 'post_payment', NULL, NULL, '0.00', NULL, NULL, '2026-04-18 06:54:03', '2026-04-18 06:54:03'),
(3, 'GRN20260003', 3, '2026-04-19', NULL, 'received', '40000.00', '0.00', '40000.00', 'paid', 'post_payment', 'bank_transfer', 'hhjkk', '40000.00', '2026-04-19 04:28:20', 'Type: bank transfer | Reference: hhjkk | Bank: BOC Bank Eheliyagoda | Account: 005909899', '2026-04-18 22:23:20', '2026-04-18 22:58:20');

-- --------------------------------------------------------

--
-- Table structure for table `grn_items`
--

CREATE TABLE `grn_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `grn_id` bigint(20) UNSIGNED NOT NULL,
  `purchase_order_item_id` bigint(20) UNSIGNED NOT NULL,
  `received_quantity` decimal(10,2) NOT NULL,
  `accepted_quantity` decimal(10,2) NOT NULL DEFAULT 0.00,
  `rejected_quantity` decimal(10,2) NOT NULL DEFAULT 0.00,
  `purchase_price` decimal(10,2) DEFAULT NULL,
  `sell_price` decimal(10,2) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `quality_status` enum('pending','accepted','rejected','partial') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `grn_items`
--

INSERT INTO `grn_items` (`id`, `grn_id`, `purchase_order_item_id`, `received_quantity`, `accepted_quantity`, `rejected_quantity`, `purchase_price`, `sell_price`, `expiry_date`, `remarks`, `quality_status`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '100.00', '100.00', '0.00', '100.00', '120.00', '2026-07-18', 'okay', 'accepted', '2026-04-18 05:05:38', '2026-04-18 05:05:38'),
(2, 1, 2, '100.00', '100.00', '0.00', '300.00', '300.00', '2026-07-18', 'okay', 'accepted', '2026-04-18 05:05:38', '2026-04-18 05:05:38'),
(3, 2, 3, '100.00', '100.00', '0.00', '100.00', '120.00', '2026-07-18', NULL, 'accepted', '2026-04-18 06:54:03', '2026-04-18 06:54:03'),
(4, 2, 4, '100.00', '100.00', '0.00', '300.00', '300.00', '2026-07-18', NULL, 'accepted', '2026-04-18 06:54:03', '2026-04-18 06:54:03'),
(5, 3, 5, '100.00', '100.00', '0.00', '100.00', '120.00', '2026-07-18', NULL, 'pending', '2026-04-18 22:23:20', '2026-04-18 22:23:20'),
(6, 3, 6, '100.00', '100.00', '0.00', '300.00', '300.00', '2026-07-18', NULL, 'pending', '2026-04-18 22:23:20', '2026-04-18 22:23:20');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_items`
--

CREATE TABLE `inventory_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('raw_material','finished_good') NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `unit` varchar(255) NOT NULL,
  `current_stock` decimal(15,2) NOT NULL DEFAULT 0.00,
  `minimum_stock` decimal(15,2) NOT NULL DEFAULT 0.00,
  `maximum_stock` decimal(15,2) DEFAULT NULL,
  `unit_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `purchase_price` decimal(10,2) DEFAULT NULL,
  `sell_price` decimal(10,2) DEFAULT NULL,
  `supplier_name` varchar(255) DEFAULT NULL,
  `supplier_id` bigint(20) UNSIGNED DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `additional_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`additional_info`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory_items`
--

INSERT INTO `inventory_items` (`id`, `name`, `code`, `description`, `type`, `category`, `unit`, `current_stock`, `minimum_stock`, `maximum_stock`, `unit_price`, `purchase_price`, `sell_price`, `supplier_name`, `supplier_id`, `location`, `expiry_date`, `status`, `additional_info`, `created_at`, `updated_at`) VALUES
(1, 'Suger', 'RM-SUGER-001', NULL, 'raw_material', 'RM', 'kg', '233.80', '0.00', '0.00', '300.00', '300.00', '300.00', 'Akalanka Imesh', 2, NULL, '2026-07-18', 'active', NULL, '2026-04-18 05:00:05', '2026-04-21 01:00:56'),
(2, 'Flover', 'RM-FLOVER-001', NULL, 'raw_material', 'Flover', 'kg', '198.00', '0.00', '0.00', '100.00', '100.00', '120.00', 'Akalanka Imesh', 2, NULL, '2026-07-18', 'active', NULL, '2026-04-18 05:00:29', '2026-04-21 01:00:56'),
(3, 'Milk Topee', 'MILK-TOPEE', 'Finished good generated from production packaging flow.', 'finished_good', 'Main Store', 'pieces', '1000.00', '100.00', '0.00', '15.00', NULL, NULL, 'Pabasara Sweets', 3, 'Main Store', '2026-06-21', 'active', NULL, '2026-04-21 02:36:11', '2026-04-21 02:40:17');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leaves`
--

CREATE TABLE `leaves` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `leave_type` enum('annual','casual','medical','maternity','other') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `days_requested` int(11) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','section_head_approved','approved','rejected') NOT NULL DEFAULT 'pending',
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approver_notes` text DEFAULT NULL,
  `approved_at` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `section_head_approved` tinyint(1) NOT NULL DEFAULT 0,
  `section_head_approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `section_head_approved_at` timestamp NULL DEFAULT NULL,
  `section_head_notes` text DEFAULT NULL,
  `hr_approved` tinyint(1) NOT NULL DEFAULT 0,
  `hr_approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `hr_approved_at` timestamp NULL DEFAULT NULL,
  `hr_notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leave_types`
--

CREATE TABLE `leave_types` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `max_days_per_year` int(11) NOT NULL DEFAULT 0,
  `requires_documentation` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `loads`
--

CREATE TABLE `loads` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `load_number` varchar(255) NOT NULL,
  `vehicle_id` bigint(20) UNSIGNED NOT NULL,
  `driver_id` bigint(20) UNSIGNED NOT NULL,
  `sales_ref_id` bigint(20) UNSIGNED DEFAULT NULL,
  `route_id` bigint(20) UNSIGNED NOT NULL,
  `status` enum('pending','in_transit','delivered','cancelled') NOT NULL DEFAULT 'pending',
  `load_date` date NOT NULL,
  `delivery_date` date DEFAULT NULL,
  `total_weight` decimal(10,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `loads`
--

INSERT INTO `loads` (`id`, `load_number`, `vehicle_id`, `driver_id`, `sales_ref_id`, `route_id`, `status`, `load_date`, `delivery_date`, `total_weight`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'VL-2026-001', 1, 4, 3, 1, 'in_transit', '2026-04-19', NULL, '0.00', NULL, '2026-04-19 03:35:16', '2026-04-19 03:43:32');

-- --------------------------------------------------------

--
-- Table structure for table `load_expenses`
--

CREATE TABLE `load_expenses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `load_id` bigint(20) UNSIGNED NOT NULL,
  `expense_date` date NOT NULL,
  `expense_type` varchar(50) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `delivery_cash_transaction_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `load_expenses`
--

INSERT INTO `load_expenses` (`id`, `load_id`, `expense_date`, `expense_type`, `amount`, `reference`, `note`, `delivery_cash_transaction_id`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, '2026-04-19', 'fuel', '7500.00', 'LDEX-1-1776619341841', 'Fuel Refill', 4, 1, '2026-04-19 11:52:22', '2026-04-19 11:52:22');

-- --------------------------------------------------------

--
-- Table structure for table `load_items`
--

CREATE TABLE `load_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `load_id` bigint(20) UNSIGNED NOT NULL,
  `product_code` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('finished_product','raw_material') NOT NULL,
  `out_price` decimal(10,2) NOT NULL,
  `sell_price` decimal(10,2) NOT NULL,
  `qty` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `load_items`
--

INSERT INTO `load_items` (`id`, `load_id`, `product_code`, `name`, `type`, `out_price`, `sell_price`, `qty`, `created_at`, `updated_at`) VALUES
(1, 1, 'RM-FLOVER-001', 'Flover', 'raw_material', '100.00', '110.00', '38.00', '2026-04-19 03:35:59', '2026-04-19 04:12:23'),
(2, 1, 'RM-SUGER-001', 'Suger', 'raw_material', '300.00', '330.00', '50.00', '2026-04-19 03:36:21', '2026-04-19 03:36:21'),
(3, 1, 'RM-FLOVER-001', 'Flover', 'raw_material', '100.00', '110.00', '10.00', '2026-04-19 03:42:20', '2026-04-19 03:42:20'),
(4, 1, 'RM-SUGER-001', 'Suger', 'raw_material', '300.00', '310.00', '12.00', '2026-04-19 03:43:51', '2026-04-19 03:43:51');

-- --------------------------------------------------------

--
-- Table structure for table `main_cash_transactions`
--

CREATE TABLE `main_cash_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `type` enum('in','out') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `main_cash_transactions`
--

INSERT INTO `main_cash_transactions` (`id`, `date`, `type`, `amount`, `reference`, `note`, `created_by`, `created_at`, `updated_at`) VALUES
(1, '2026-04-19', 'out', '50000.00', 'tc', 'Fund transfer issued. Dr Petty Cash Account, Cr Cash Account.', 1, '2026-04-18 23:12:30', '2026-04-18 23:12:30'),
(2, '2026-04-19', 'out', '50000.00', 'uui', 'Fund transfer issued. Dr Delivery Cash Account, Cr Cash Account.', 1, '2026-04-18 23:23:35', '2026-04-18 23:23:35'),
(3, '2026-04-19', 'out', '50000.00', 'bnk', 'Fund transfer issued. Dr Petty Cash Account, Cr Bank - BOC Bank Eheliyagoda.', 1, '2026-04-19 01:36:32', '2026-04-19 01:36:32'),
(4, '2026-04-19', 'out', '100000.00', 'salary jan', 'Cash withdrawal posted. Dr Cash Withdrawal For Salary, Cr Cash Account.', 1, '2026-04-19 02:01:22', '2026-04-19 02:01:22'),
(5, '2026-04-19', 'out', '100000.00', 'Profit', 'Cash withdrawal posted. Dr Cash Withdrawal For Profit, Cr Cash Account.', 1, '2026-04-19 02:02:57', '2026-04-19 02:02:57'),
(6, '2026-04-19', 'in', '1100.00', 'CHQ-ENDCLR-2', 'End cheque clearance | Cheque: 90009090 | Bank: BOC Bank Eheliyagoda | Source: distribution', 1, '2026-04-19 06:38:36', '2026-04-19 06:38:36'),
(7, '2026-04-19', 'in', '220.00', 'CHQ-DEP-1', 'Cheque deposit | Cheque: 90889888 | Bank: BOC Bank Eheliyagoda | Source: distribution', 1, '2026-04-19 06:40:36', '2026-04-19 06:40:36');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2026_04_18_000004_add_epf_etf_contributions_to_employees_table', 1),
(2, '2026_04_18_000005_add_tax_fields_to_employees_table', 2),
(3, '2026_04_18_000006_add_payment_fields_to_goods_received_notes_table', 3),
(4, '2026_04_18_000007_add_payment_option_fields_to_goods_received_notes_table', 4),
(5, '2026_04_19_000008_create_cheque_registry_entries_table', 5),
(6, '2026_04_19_000009_add_cheque_date_to_distribution_payments_table', 6),
(7, '2026_04_19_000010_create_load_expenses_table', 7),
(8, '2026_04_21_100000_add_batch_no_to_production_orders_table', 8),
(9, '2026_04_21_101000_add_batch_tracking_to_packaging_batches_table', 9);

-- --------------------------------------------------------

--
-- Table structure for table `outlets`
--

CREATE TABLE `outlets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `manager_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `outlet_cash_drawers`
--

CREATE TABLE `outlet_cash_drawers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `outlet_id` bigint(20) UNSIGNED NOT NULL,
  `balance` decimal(14,2) NOT NULL DEFAULT 0.00,
  `last_set_by` bigint(20) UNSIGNED DEFAULT NULL,
  `last_set_at` datetime DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `outlet_cash_drawer_sessions`
--

CREATE TABLE `outlet_cash_drawer_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `outlet_id` bigint(20) UNSIGNED NOT NULL,
  `session_date` date NOT NULL,
  `opening_balance` decimal(14,2) NOT NULL,
  `opened_at` datetime NOT NULL,
  `opened_by` bigint(20) UNSIGNED DEFAULT NULL,
  `opening_note` varchar(255) DEFAULT NULL,
  `closing_balance` decimal(14,2) DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `closed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `closing_note` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `outlet_loyalty_customers`
--

CREATE TABLE `outlet_loyalty_customers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `outlet_id` bigint(20) UNSIGNED NOT NULL,
  `customer_code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `points_balance` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_visits` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `total_spent` decimal(14,2) NOT NULL DEFAULT 0.00,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `notes` varchar(255) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `outlet_sales`
--

CREATE TABLE `outlet_sales` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `sale_number` varchar(60) NOT NULL,
  `outlet_id` bigint(20) UNSIGNED NOT NULL,
  `sold_by` bigint(20) UNSIGNED DEFAULT NULL,
  `sale_date` datetime NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `loyalty_customer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `total_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `payment_type` varchar(20) NOT NULL DEFAULT 'cash',
  `balance_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `loyalty_points_awarded` decimal(14,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `outlet_sale_items`
--

CREATE TABLE `outlet_sale_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `outlet_sale_id` bigint(20) UNSIGNED NOT NULL,
  `inventory_item_id` bigint(20) UNSIGNED NOT NULL,
  `item_code` varchar(80) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `unit` varchar(30) DEFAULT NULL,
  `issue_type` varchar(20) NOT NULL DEFAULT 'retail',
  `discount_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `quantity` decimal(12,2) NOT NULL,
  `unit_price` decimal(14,2) NOT NULL,
  `line_total` decimal(14,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `packaging_batches`
--

CREATE TABLE `packaging_batches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `qc_inspection_id` bigint(20) UNSIGNED NOT NULL,
  `production_order_id` bigint(20) UNSIGNED NOT NULL,
  `batch_no` varchar(80) DEFAULT NULL,
  `packaging_material_name` varchar(150) NOT NULL,
  `packaging_material_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `packaging_material_unit` varchar(30) NOT NULL DEFAULT 'pcs',
  `packed_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `unit_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('planned','packed','dispatched') NOT NULL DEFAULT 'planned',
  `label_code` varchar(120) NOT NULL,
  `barcode_value` varchar(200) DEFAULT NULL,
  `qr_value` varchar(255) DEFAULT NULL,
  `packed_at` timestamp NULL DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `main_store_synced_at` timestamp NULL DEFAULT NULL,
  `main_store_synced_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `packaging_batches`
--

INSERT INTO `packaging_batches` (`id`, `qc_inspection_id`, `production_order_id`, `batch_no`, `packaging_material_name`, `packaging_material_quantity`, `packaging_material_unit`, `packed_quantity`, `unit_price`, `status`, `label_code`, `barcode_value`, `qr_value`, `packed_at`, `expiry_date`, `main_store_synced_at`, `main_store_synced_quantity`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 3, NULL, 'Food Grade Wrapper', '1000.000', 'pcs', '1000.000', '0.00', 'packed', 'LBL-MILK-TOPEE-20260421-0001', 'BAR-3-779824D4', 'QR|3|LBL-MILK-TOPEE-20260421-0001', '2026-04-21 02:24:17', NULL, NULL, '0.000', NULL, '2026-04-21 02:24:02', '2026-04-21 02:24:17'),
(2, 1, 3, NULL, 'Food Grade Wrapper', '100.000', 'pcs', '1000.000', '0.00', 'dispatched', 'LBL-MILK-TOPEE-20260421-0002', 'BAR-3-5E180308', 'QR|3|LBL-MILK-TOPEE-20260421-0002', '2026-04-21 02:36:11', NULL, '2026-04-21 02:36:11', '1000.000', NULL, '2026-04-21 02:35:54', '2026-04-21 02:36:11');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payrolls`
--

CREATE TABLE `payrolls` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `month_year` varchar(255) NOT NULL,
  `basic_salary` decimal(10,2) NOT NULL,
  `allowances` decimal(10,2) NOT NULL DEFAULT 0.00,
  `deductions` decimal(10,2) NOT NULL DEFAULT 0.00,
  `net_salary` decimal(10,2) NOT NULL,
  `working_days` int(11) NOT NULL,
  `present_days` int(11) NOT NULL,
  `absent_days` int(11) NOT NULL,
  `overtime_hours` decimal(5,2) NOT NULL DEFAULT 0.00,
  `overtime_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('pending','processed','paid') NOT NULL DEFAULT 'pending',
  `processed_at` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `module` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'distribution_view_customers', 'Distribution', 'View Customers', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(2, 'distribution_manage_customers', 'Distribution', 'Manage Customers', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(3, 'distribution_view_invoices', 'Distribution', 'View Invoices', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(4, 'distribution_create_invoices', 'Distribution', 'Create Invoices', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(5, 'distribution_manage_returns', 'Distribution', 'Manage Returns', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(6, 'distribution_record_payments', 'Distribution', 'Record Payments', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(7, 'distribution_view_debtors', 'Distribution', 'View Debtors', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(8, 'distribution_view_customer_ledger', 'Distribution', 'View Customer Ledger', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(9, 'hrm_view_employees', 'HRM', 'View Employees', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(10, 'hrm_manage_employees', 'HRM', 'Manage Employees', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(11, 'hrm_view_departments', 'HRM', 'View Departments', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(12, 'hrm_manage_departments', 'HRM', 'Manage Departments', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(13, 'hrm_view_designations', 'HRM', 'View Designations', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(14, 'hrm_manage_designations', 'HRM', 'Manage Designations', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(15, 'hrm_manage_attendance', 'HRM', 'Manage Attendance', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(16, 'hrm_manage_leave', 'HRM', 'Manage Leave', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(17, 'hrm_manage_payroll', 'HRM', 'Manage Payroll', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(18, 'hrm_manage_candidates', 'HRM', 'Manage Candidates', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(19, 'purchasing_view_purchase_orders', 'Purchasing', 'View Purchase Orders', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(20, 'purchasing_create_purchase_orders', 'Purchasing', 'Create Purchase Orders', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(21, 'purchasing_manage_grn', 'Purchasing', 'Manage GRN', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(22, 'stock_view_inventory', 'Stock', 'View Inventory', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(23, 'stock_manage_inventory', 'Stock', 'Manage Inventory', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(24, 'stock_manage_transfers', 'Stock', 'Manage Transfers', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(25, 'stock_manage_suppliers', 'Stock', 'Manage Suppliers', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(26, 'production_view_production_plans', 'Production', 'View Production Plans', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(27, 'production_manage_production_plans', 'Production', 'Manage Production Plans', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(28, 'production_manage_bom', 'Production', 'Manage BOM', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(29, 'production_manage_production_execution', 'Production', 'Manage Production Execution', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(30, 'production_manage_qc', 'Production', 'Manage QC', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(31, 'production_manage_packaging', 'Production', 'Manage Packaging', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(32, 'vehicle-loading_view_vehicles', 'Vehicle Loading', 'View Vehicles', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(33, 'vehicle-loading_manage_vehicles', 'Vehicle Loading', 'Manage Vehicles', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(34, 'vehicle-loading_view_routes', 'Vehicle Loading', 'View Routes', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(35, 'vehicle-loading_manage_routes', 'Vehicle Loading', 'Manage Routes', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(36, 'vehicle-loading_view_loads', 'Vehicle Loading', 'View Loads', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(37, 'vehicle-loading_manage_loads', 'Vehicle Loading', 'Manage Loads', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(38, 'vehicle-loading_manage_load_items', 'Vehicle Loading', 'Manage Load Items', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(39, 'outlet-pos_view_sales', 'Outlet POS', 'View Sales', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(40, 'outlet-pos_create_sales', 'Outlet POS', 'Create Sales', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(41, 'outlet-pos_manage_cash_drawer', 'Outlet POS', 'Manage Cash Drawer', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(42, 'outlet-pos_manage_loyalty_customers', 'Outlet POS', 'Manage Loyalty Customers', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(43, 'outlet-pos_view_outlet_reports', 'Outlet POS', 'View Outlet Reports', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(44, 'reports_view_hr_reports', 'Reports', 'View HR Reports', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(45, 'reports_view_distribution_reports', 'Reports', 'View Distribution Reports', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(46, 'reports_view_purchasing_reports', 'Reports', 'View Purchasing Reports', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(47, 'reports_view_stock_reports', 'Reports', 'View Stock Reports', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(48, 'reports_view_vehicle_loading_reports', 'Reports', 'View Vehicle Loading Reports', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(49, 'settings_manage_system_settings', 'Settings', 'Manage System Settings', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(50, 'settings_manage_security_settings', 'Settings', 'Manage Security Settings', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(51, 'settings_manage_backup_settings', 'Settings', 'Manage Backup Settings', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(52, 'settings_manage_company_settings', 'Settings', 'Manage Company Settings', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(53, 'other_manage_system_settings', 'Other', 'Manage System Settings', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(54, 'other_manage_security_settings', 'Other', 'Manage Security Settings', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(55, 'other_manage_backup_settings', 'Other', 'Manage Backup Settings', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(56, 'branches_view_branches', 'Branches', 'View Branches', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(57, 'branches_manage_branches', 'Branches', 'Manage Branches', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(58, 'branches_view_branch_stock_report', 'Branches', 'View Branch Stock Report', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(59, 'other_manage_roles', 'Other', 'Manage Roles', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(60, 'other_manage_permissions', 'Other', 'Manage Permissions', 1, '2026-04-18 02:13:34', '2026-04-18 02:13:34'),
(61, 'view_users', 'User Management', 'View users', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(62, 'create_users', 'User Management', 'Create users', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(63, 'edit_users', 'User Management', 'Edit users', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(64, 'delete_users', 'User Management', 'Delete users', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(65, 'view_employees', 'Employee Management', 'View employees', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(66, 'create_employees', 'Employee Management', 'Create employees', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(67, 'edit_employees', 'Employee Management', 'Edit employees', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(68, 'delete_employees', 'Employee Management', 'Delete employees', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(69, 'view_departments', 'Department Management', 'View departments', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(70, 'create_departments', 'Department Management', 'Create departments', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(71, 'edit_departments', 'Department Management', 'Edit departments', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(72, 'delete_departments', 'Department Management', 'Delete departments', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(73, 'view_attendance', 'Attendance Management', 'View attendance records', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(74, 'create_attendance', 'Attendance Management', 'Create attendance records', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(75, 'edit_attendance', 'Attendance Management', 'Edit attendance records', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(76, 'delete_attendance', 'Attendance Management', 'Delete attendance records', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(77, 'view_leaves', 'Leave Management', 'View leave requests', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(78, 'create_leaves', 'Leave Management', 'Create leave requests', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(79, 'approve_leaves', 'Leave Management', 'Approve leave requests', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(80, 'reject_leaves', 'Leave Management', 'Reject leave requests', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(81, 'view_payrolls', 'Payroll Management', 'View payroll records', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(82, 'create_payrolls', 'Payroll Management', 'Create payroll records', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(83, 'edit_payrolls', 'Payroll Management', 'Edit payroll records', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(84, 'delete_payrolls', 'Payroll Management', 'Delete payroll records', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(85, 'view_candidates', 'Candidate Management', 'View candidates', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(86, 'create_candidates', 'Candidate Management', 'Create candidates', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(87, 'edit_candidates', 'Candidate Management', 'Edit candidates', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(88, 'delete_candidates', 'Candidate Management', 'Delete candidates', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(89, 'accounts.view_main_account', 'accounts', 'View main account', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(90, 'accounts.manage_main_account', 'accounts', 'Manage main account transactions', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(91, 'accounts.view_transaction_book', 'accounts', 'View transaction book', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(92, 'accounts.manage_transaction_book', 'accounts', 'Manage transaction book', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(93, 'accounts.view_petty_cash', 'accounts', 'View petty cash', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(94, 'accounts.manage_petty_cash', 'accounts', 'Manage petty cash', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(95, 'accounts.view_delivery_cash', 'accounts', 'View delivery cash', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(96, 'accounts.manage_delivery_cash', 'accounts', 'Manage delivery cash', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(97, 'accounts.approve_outlet_funds', 'accounts', 'Approve outlet fund requests', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(98, 'view_roles', 'Role Management', 'View roles', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(99, 'create_roles', 'Role Management', 'Create roles', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(100, 'edit_roles', 'Role Management', 'Edit roles', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(101, 'delete_roles', 'Role Management', 'Delete roles', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(102, 'assign_roles', 'Role Management', 'Assign roles to users', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(103, 'view_permissions', 'Permission Management', 'View permissions', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(104, 'create_permissions', 'Permission Management', 'Create permissions', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(105, 'edit_permissions', 'Permission Management', 'Edit permissions', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(106, 'delete_permissions', 'Permission Management', 'Delete permissions', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(107, 'accounts_view_main_account', 'Accounts', 'View Main Account', 1, '2026-04-18 02:26:18', '2026-04-18 02:26:18'),
(108, 'accounts_manage_main_account', 'Accounts', 'Manage Main Account', 1, '2026-04-18 02:26:18', '2026-04-18 02:26:18'),
(109, 'accounts_view_transaction_book', 'Accounts', 'View Transaction Book', 1, '2026-04-18 02:26:18', '2026-04-18 02:26:18'),
(110, 'accounts_manage_transaction_book', 'Accounts', 'Manage Transaction Book', 1, '2026-04-18 02:26:18', '2026-04-18 02:26:18'),
(111, 'accounts_view_petty_cash', 'Accounts', 'View Petty Cash', 1, '2026-04-18 02:26:18', '2026-04-18 02:26:18'),
(112, 'accounts_manage_petty_cash', 'Accounts', 'Manage Petty Cash', 1, '2026-04-18 02:26:18', '2026-04-18 02:26:18'),
(113, 'accounts_view_delivery_cash', 'Accounts', 'View Delivery Cash', 1, '2026-04-18 02:26:18', '2026-04-18 02:26:18'),
(114, 'accounts_manage_delivery_cash', 'Accounts', 'Manage Delivery Cash', 1, '2026-04-18 02:26:18', '2026-04-18 02:26:18'),
(115, 'accounts_approve_outlet_transfers', 'Accounts', 'Approve Outlet Transfers', 1, '2026-04-18 02:26:18', '2026-04-18 02:26:18');

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 1, 'API Token', '8dc4651e0c12630dd2f10c2afcb2b0b571712e188f18a91b0b76001456c440e4', '[\"*\"]', '2026-04-19 07:07:19', NULL, '2026-04-18 01:57:54', '2026-04-19 07:07:19'),
(2, 'App\\Models\\User', 3, 'API Token', '84966a1d23b0b8d0a04de665369ee97c19be46b6068f702b2779d1e0c57b8447', '[\"*\"]', '2026-04-19 04:12:25', NULL, '2026-04-19 03:56:10', '2026-04-19 04:12:25'),
(3, 'App\\Models\\User', 1, 'API Token', '065718c8e85ae03158bed20a4653100fa119182a0e12f917b967f27175128e26', '[\"*\"]', '2026-04-21 22:30:00', NULL, '2026-04-19 11:35:46', '2026-04-21 22:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `petty_cash_transactions`
--

CREATE TABLE `petty_cash_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `type` enum('in','out') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `petty_cash_transactions`
--

INSERT INTO `petty_cash_transactions` (`id`, `date`, `type`, `amount`, `reference`, `note`, `created_by`, `created_at`, `updated_at`) VALUES
(1, '2026-04-19', 'in', '50000.00', 'tc', 'Fund transfer received. Dr Petty Cash Account, Cr Cash Account.', 1, '2026-04-18 23:12:30', '2026-04-18 23:12:30'),
(2, '2026-04-19', 'in', '50000.00', 'bnk', 'Fund transfer received. Dr Petty Cash Account, Cr Bank - BOC Bank Eheliyagoda.', 1, '2026-04-19 01:36:31', '2026-04-19 01:36:31');

-- --------------------------------------------------------

--
-- Table structure for table `production_orders`
--

CREATE TABLE `production_orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `production_plan_id` bigint(20) UNSIGNED DEFAULT NULL,
  `batch_no` varchar(80) DEFAULT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `bom_id` bigint(20) UNSIGNED NOT NULL,
  `production_quantity` decimal(15,3) NOT NULL,
  `produced_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `wastage_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `batch_size` decimal(15,3) NOT NULL,
  `multiplier` decimal(15,4) NOT NULL,
  `machine_name` varchar(255) DEFAULT NULL,
  `workstation_name` varchar(255) DEFAULT NULL,
  `worker_name` varchar(255) DEFAULT NULL,
  `status` enum('started','completed','cancelled') NOT NULL DEFAULT 'started',
  `material_requirements` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`material_requirements`)),
  `actual_material_consumption` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`actual_material_consumption`)),
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `production_orders`
--

INSERT INTO `production_orders` (`id`, `production_plan_id`, `batch_no`, `product_id`, `bom_id`, `production_quantity`, `produced_quantity`, `wastage_quantity`, `batch_size`, `multiplier`, `machine_name`, `workstation_name`, `worker_name`, `status`, `material_requirements`, `actual_material_consumption`, `started_at`, `completed_at`, `cancelled_at`, `notes`, `created_at`, `updated_at`) VALUES
(1, NULL, NULL, 2, 2, '1000.000', '0.000', '0.000', '100.000', '10.0000', NULL, NULL, NULL, 'started', '[{\"material_id\":1,\"inventory_item_id\":1,\"material_name\":\"Suger\",\"material_code\":\"RM-SUGER-001\",\"unit\":\"kg\",\"required_quantity\":2,\"available_before\":238,\"available_after\":236},{\"material_id\":2,\"inventory_item_id\":2,\"material_name\":\"Flover\",\"material_code\":\"RM-FLOVER-001\",\"unit\":\"kg\",\"required_quantity\":20,\"available_before\":240,\"available_after\":220}]', NULL, '2026-04-20 07:07:49', NULL, NULL, 'Started from BOM Formula Management screen', '2026-04-20 07:07:49', '2026-04-20 07:07:49'),
(2, 1, NULL, 2, 2, '1000.000', '0.000', '0.000', '100.000', '10.0000', 'Machine-01', 'WS-A', 'Saman Ranjith', 'started', '[{\"material_id\":1,\"inventory_item_id\":1,\"material_name\":\"Suger\",\"material_code\":\"RM-SUGER-001\",\"unit\":\"kg\",\"required_quantity\":2,\"available_before\":236,\"available_after\":234},{\"material_id\":2,\"inventory_item_id\":2,\"material_name\":\"Flover\",\"material_code\":\"RM-FLOVER-001\",\"unit\":\"kg\",\"required_quantity\":20,\"available_before\":220,\"available_after\":200}]', '[{\"material_id\":1,\"inventory_item_id\":1,\"material_name\":\"Suger\",\"material_code\":\"RM-SUGER-001\",\"unit\":\"kg\",\"required_quantity\":2,\"available_before\":236,\"available_after\":234},{\"material_id\":2,\"inventory_item_id\":2,\"material_name\":\"Flover\",\"material_code\":\"RM-FLOVER-001\",\"unit\":\"kg\",\"required_quantity\":20,\"available_before\":220,\"available_after\":200}]', '2026-04-21 00:54:38', NULL, NULL, NULL, '2026-04-21 00:54:38', '2026-04-21 00:54:38'),
(3, 2, NULL, 2, 2, '100.000', '1000.000', '0.000', '100.000', '1.0000', 'Machine-01', 'WS-A', 'Chaminda', 'completed', '[{\"material_id\":1,\"inventory_item_id\":1,\"material_name\":\"Suger\",\"material_code\":\"RM-SUGER-001\",\"unit\":\"kg\",\"required_quantity\":0.2,\"available_before\":234,\"available_after\":233.8},{\"material_id\":2,\"inventory_item_id\":2,\"material_name\":\"Flover\",\"material_code\":\"RM-FLOVER-001\",\"unit\":\"kg\",\"required_quantity\":2,\"available_before\":200,\"available_after\":198}]', '[{\"material_id\":1,\"inventory_item_id\":1,\"material_name\":\"Suger\",\"material_code\":\"RM-SUGER-001\",\"unit\":\"kg\",\"required_quantity\":0.2,\"available_before\":234,\"available_after\":233.8},{\"material_id\":2,\"inventory_item_id\":2,\"material_name\":\"Flover\",\"material_code\":\"RM-FLOVER-001\",\"unit\":\"kg\",\"required_quantity\":2,\"available_before\":200,\"available_after\":198}]', '2026-04-21 01:00:56', '2026-04-21 01:01:23', NULL, 'Starting with machin one', '2026-04-21 01:00:56', '2026-04-21 01:01:23');

-- --------------------------------------------------------

--
-- Table structure for table `production_plans`
--

CREATE TABLE `production_plans` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `bom_id` bigint(20) UNSIGNED DEFAULT NULL,
  `plan_date` date NOT NULL,
  `shift` varchar(50) DEFAULT NULL,
  `target_quantity` decimal(15,3) NOT NULL,
  `batch_count` decimal(12,2) NOT NULL DEFAULT 1.00,
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `status` enum('draft','scheduled','order_created','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
  `order_number` varchar(60) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `production_plans`
--

INSERT INTO `production_plans` (`id`, `product_id`, `bom_id`, `plan_date`, `shift`, `target_quantity`, `batch_count`, `priority`, `status`, `order_number`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 2, 2, '2026-04-20', 'Morning', '1000.000', '1.00', 'high', 'in_progress', 'PO-20260420-0001', NULL, 1, '2026-04-20 07:09:06', '2026-04-21 00:54:38'),
(2, 2, 2, '2026-04-21', 'Morning', '100.000', '1.00', 'medium', 'completed', 'PO-20260421-0001', NULL, 1, '2026-04-21 01:00:13', '2026-04-21 01:01:23');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `unit` varchar(255) NOT NULL DEFAULT 'pcs',
  `standard_batch_size` decimal(15,3) NOT NULL DEFAULT 1.000,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `code`, `unit`, `standard_batch_size`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Murukku', 'MURUKKU', 'pcs', '1000.000', 'Murukku Production 2026.04.19', 'active', '2026-04-19 12:03:04', '2026-04-19 12:03:04'),
(2, 'Milk Topee', 'MILK-TOPEE', 'pieces', '1000.000', 'Finished good generated from production packaging flow.', 'active', '2026-04-19 12:13:01', '2026-04-21 02:39:49');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_orders`
--

CREATE TABLE `purchase_orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_number` varchar(255) NOT NULL,
  `supplier_id` bigint(20) UNSIGNED NOT NULL,
  `order_date` date NOT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `status` enum('pending','approved','received','cancelled') NOT NULL DEFAULT 'pending',
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `purchase_orders`
--

INSERT INTO `purchase_orders` (`id`, `order_number`, `supplier_id`, `order_date`, `expected_delivery_date`, `status`, `total_amount`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'PO20260001', 2, '2026-04-18', '2026-04-18', 'pending', '0.00', NULL, '2026-04-18 05:01:12', '2026-04-18 05:01:12'),
(2, 'PO20260002', 2, '2026-04-18', '2026-04-18', 'pending', '40000.00', NULL, '2026-04-18 05:07:59', '2026-04-18 05:07:59'),
(3, 'PO20260003', 2, '2026-04-19', '2026-04-19', 'pending', '40000.00', NULL, '2026-04-18 21:39:32', '2026-04-18 21:39:32');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_order_items`
--

CREATE TABLE `purchase_order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `purchase_order_id` bigint(20) UNSIGNED NOT NULL,
  `inventory_item_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(15,2) NOT NULL,
  `received_quantity` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `purchase_order_items`
--

INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `inventory_item_id`, `quantity`, `unit_price`, `total_price`, `received_quantity`, `created_at`, `updated_at`) VALUES
(1, 1, 2, '100.00', '0.00', '0.00', '100.00', '2026-04-18 05:01:12', '2026-04-18 05:05:38'),
(2, 1, 1, '100.00', '0.00', '0.00', '100.00', '2026-04-18 05:01:12', '2026-04-18 05:05:38'),
(3, 2, 2, '100.00', '100.00', '10000.00', '100.00', '2026-04-18 05:07:59', '2026-04-18 06:54:03'),
(4, 2, 1, '100.00', '300.00', '30000.00', '100.00', '2026-04-18 05:07:59', '2026-04-18 06:54:03'),
(5, 3, 2, '100.00', '100.00', '10000.00', '100.00', '2026-04-18 21:39:32', '2026-04-18 22:23:20'),
(6, 3, 1, '100.00', '300.00', '30000.00', '100.00', '2026-04-18 21:39:32', '2026-04-18 22:23:20');

-- --------------------------------------------------------

--
-- Table structure for table `qc_inspections`
--

CREATE TABLE `qc_inspections` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `production_order_id` bigint(20) UNSIGNED NOT NULL,
  `inspection_date` date NOT NULL,
  `inspector_name` varchar(120) NOT NULL,
  `quality_status` enum('approved','rejected','hold') NOT NULL DEFAULT 'hold',
  `approved_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `rejected_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `food_safety_checklist` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`food_safety_checklist`)),
  `defects_notes` text DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `report_notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `qc_inspections`
--

INSERT INTO `qc_inspections` (`id`, `production_order_id`, `inspection_date`, `inspector_name`, `quality_status`, `approved_quantity`, `rejected_quantity`, `food_safety_checklist`, `defects_notes`, `rejection_reason`, `report_notes`, `created_at`, `updated_at`) VALUES
(1, 3, '2026-04-21', 'Shashini rupasighe', 'approved', '1000.000', '0.000', '{\"temperature_check\":true,\"hygiene_check\":true,\"packaging_check\":true,\"label_check\":true}', 'No', 'No', 'No', '2026-04-21 01:40:33', '2026-04-21 01:40:33');

-- --------------------------------------------------------

--
-- Table structure for table `raw_materials`
--

CREATE TABLE `raw_materials` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `inventory_item_id` bigint(20) UNSIGNED NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `raw_materials`
--

INSERT INTO `raw_materials` (`id`, `inventory_item_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'active', '2026-04-18 05:00:05', '2026-04-18 05:00:05'),
(2, 2, 'active', '2026-04-18 05:00:29', '2026-04-18 05:00:29');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Super Admin', 'Super Admin', 1, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(2, 'Admin/Owner', 'Admin/Owner', 1, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(3, 'Production Manager', 'Production Manager', 1, '2026-04-18 02:14:59', '2026-04-18 02:14:59'),
(4, 'Production Operator', 'Production Operator', 1, '2026-04-18 02:15:43', '2026-04-18 02:15:43'),
(5, 'Store Keeper', 'Store Keeper (Inventory Manager)', 1, '2026-04-18 02:16:16', '2026-04-18 02:16:16'),
(6, 'Purchasing Officer', 'Purchasing Officer', 1, '2026-04-18 02:16:39', '2026-04-18 02:16:39'),
(7, 'Distribution Manager', 'Distribution Manager', 1, '2026-04-18 02:16:59', '2026-04-18 02:16:59'),
(8, 'Cashier', 'Cashier Ourlets', 1, '2026-04-18 02:17:40', '2026-04-18 02:17:40'),
(9, 'Sales Person', 'Sales Person', 1, '2026-04-18 02:18:01', '2026-04-18 02:18:01'),
(10, 'HR Manager', 'HR Manager', 1, '2026-04-18 02:19:00', '2026-04-18 02:19:00'),
(11, 'HR Officer', 'Human Resources officer with limited HR access', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(12, 'Department Head', 'Department head with access to department-specific functions', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(13, 'Employee', 'Regular employee with basic access', 1, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(14, 'Accountant', 'Accountant', 1, '2026-04-18 02:26:19', '2026-04-18 02:26:19'),
(15, 'Driver', 'Driver', 1, '2026-04-18 02:27:02', '2026-04-18 02:27:02');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `permission_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(2, 1, 2, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(3, 1, 3, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(4, 1, 4, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(5, 1, 5, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(6, 1, 6, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(7, 1, 7, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(8, 1, 8, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(9, 1, 9, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(10, 1, 10, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(11, 1, 11, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(12, 1, 12, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(13, 1, 13, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(14, 1, 14, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(15, 1, 15, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(16, 1, 16, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(17, 1, 17, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(18, 1, 18, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(19, 1, 19, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(20, 1, 20, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(21, 1, 21, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(22, 1, 22, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(23, 1, 23, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(24, 1, 24, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(25, 1, 25, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(26, 1, 26, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(27, 1, 27, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(28, 1, 28, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(29, 1, 29, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(30, 1, 30, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(31, 1, 31, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(32, 1, 32, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(33, 1, 33, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(34, 1, 34, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(35, 1, 35, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(36, 1, 36, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(37, 1, 37, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(38, 1, 38, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(39, 1, 39, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(40, 1, 40, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(41, 1, 41, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(42, 1, 42, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(43, 1, 43, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(44, 1, 44, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(45, 1, 45, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(46, 1, 46, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(47, 1, 47, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(48, 1, 48, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(49, 1, 49, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(50, 1, 50, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(51, 1, 51, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(52, 1, 52, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(53, 1, 53, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(54, 1, 54, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(55, 1, 55, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(56, 1, 56, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(57, 1, 57, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(58, 1, 58, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(59, 1, 59, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(60, 1, 60, '2026-04-18 02:13:35', '2026-04-18 02:13:35'),
(61, 2, 4, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(62, 2, 2, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(63, 2, 5, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(64, 2, 6, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(65, 2, 8, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(66, 2, 1, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(67, 2, 7, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(68, 2, 3, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(69, 2, 15, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(70, 2, 18, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(71, 2, 12, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(72, 2, 14, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(73, 2, 10, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(74, 2, 16, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(75, 2, 17, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(76, 2, 11, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(77, 2, 13, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(78, 2, 9, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(79, 2, 20, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(80, 2, 21, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(81, 2, 19, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(82, 2, 23, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(83, 2, 25, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(84, 2, 24, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(85, 2, 22, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(86, 2, 28, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(87, 2, 31, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(88, 2, 29, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(89, 2, 27, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(90, 2, 30, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(91, 2, 26, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(92, 2, 38, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(93, 2, 37, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(94, 2, 35, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(95, 2, 33, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(96, 2, 36, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(97, 2, 34, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(98, 2, 32, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(99, 2, 40, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(100, 2, 41, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(101, 2, 42, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(102, 2, 43, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(103, 2, 39, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(104, 2, 45, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(105, 2, 44, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(106, 2, 46, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(107, 2, 47, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(108, 2, 48, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(109, 2, 55, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(110, 2, 54, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(111, 2, 53, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(112, 2, 51, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(113, 2, 52, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(114, 2, 50, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(115, 2, 49, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(116, 2, 57, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(117, 2, 58, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(118, 2, 56, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(119, 2, 60, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(120, 2, 59, '2026-04-18 02:13:53', '2026-04-18 02:13:53'),
(121, 3, 28, '2026-04-18 02:14:59', '2026-04-18 02:14:59'),
(122, 3, 31, '2026-04-18 02:14:59', '2026-04-18 02:14:59'),
(123, 3, 29, '2026-04-18 02:14:59', '2026-04-18 02:14:59'),
(124, 3, 27, '2026-04-18 02:14:59', '2026-04-18 02:14:59'),
(125, 3, 30, '2026-04-18 02:14:59', '2026-04-18 02:14:59'),
(126, 3, 26, '2026-04-18 02:14:59', '2026-04-18 02:14:59'),
(127, 4, 30, '2026-04-18 02:15:43', '2026-04-18 02:15:43'),
(128, 4, 26, '2026-04-18 02:15:43', '2026-04-18 02:15:43'),
(129, 4, 27, '2026-04-18 02:15:43', '2026-04-18 02:15:43'),
(130, 4, 29, '2026-04-18 02:15:43', '2026-04-18 02:15:43'),
(131, 4, 31, '2026-04-18 02:15:43', '2026-04-18 02:15:43'),
(132, 5, 23, '2026-04-18 02:16:16', '2026-04-18 02:16:16'),
(133, 5, 25, '2026-04-18 02:16:16', '2026-04-18 02:16:16'),
(134, 5, 24, '2026-04-18 02:16:16', '2026-04-18 02:16:16'),
(135, 5, 22, '2026-04-18 02:16:16', '2026-04-18 02:16:16'),
(136, 6, 20, '2026-04-18 02:16:39', '2026-04-18 02:16:39'),
(137, 6, 21, '2026-04-18 02:16:39', '2026-04-18 02:16:39'),
(138, 6, 19, '2026-04-18 02:16:39', '2026-04-18 02:16:39'),
(139, 7, 4, '2026-04-18 02:16:59', '2026-04-18 02:16:59'),
(140, 7, 2, '2026-04-18 02:16:59', '2026-04-18 02:16:59'),
(141, 7, 5, '2026-04-18 02:16:59', '2026-04-18 02:16:59'),
(142, 7, 6, '2026-04-18 02:16:59', '2026-04-18 02:16:59'),
(143, 7, 8, '2026-04-18 02:16:59', '2026-04-18 02:16:59'),
(144, 7, 1, '2026-04-18 02:16:59', '2026-04-18 02:16:59'),
(145, 7, 7, '2026-04-18 02:16:59', '2026-04-18 02:16:59'),
(146, 7, 3, '2026-04-18 02:16:59', '2026-04-18 02:16:59'),
(147, 8, 40, '2026-04-18 02:17:40', '2026-04-18 02:17:40'),
(148, 8, 41, '2026-04-18 02:17:40', '2026-04-18 02:17:40'),
(149, 8, 42, '2026-04-18 02:17:40', '2026-04-18 02:17:40'),
(150, 8, 43, '2026-04-18 02:17:40', '2026-04-18 02:17:40'),
(151, 8, 39, '2026-04-18 02:17:40', '2026-04-18 02:17:40'),
(152, 9, 4, '2026-04-18 02:18:01', '2026-04-18 02:18:01'),
(153, 9, 2, '2026-04-18 02:18:01', '2026-04-18 02:18:01'),
(154, 9, 5, '2026-04-18 02:18:01', '2026-04-18 02:18:01'),
(155, 9, 6, '2026-04-18 02:18:01', '2026-04-18 02:18:01'),
(157, 9, 1, '2026-04-18 02:18:01', '2026-04-18 02:18:01'),
(158, 9, 7, '2026-04-18 02:18:01', '2026-04-18 02:18:01'),
(159, 9, 3, '2026-04-18 02:18:01', '2026-04-18 02:18:01'),
(170, 1, 97, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(171, 1, 96, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(172, 1, 90, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(173, 1, 94, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(174, 1, 92, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(175, 1, 95, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(176, 1, 89, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(177, 1, 93, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(178, 1, 91, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(179, 1, 79, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(180, 1, 102, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(181, 1, 74, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(182, 1, 86, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(183, 1, 70, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(184, 1, 66, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(185, 1, 78, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(186, 1, 82, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(187, 1, 104, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(188, 1, 99, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(189, 1, 62, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(190, 1, 76, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(191, 1, 88, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(192, 1, 72, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(193, 1, 68, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(194, 1, 84, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(195, 1, 106, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(196, 1, 101, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(197, 1, 64, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(198, 1, 75, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(199, 1, 87, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(200, 1, 71, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(201, 1, 67, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(202, 1, 83, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(203, 1, 105, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(204, 1, 100, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(205, 1, 63, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(206, 1, 80, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(207, 1, 73, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(208, 1, 85, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(209, 1, 69, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(210, 1, 65, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(211, 1, 77, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(212, 1, 81, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(213, 1, 103, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(214, 1, 98, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(215, 1, 61, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(216, 10, 79, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(217, 10, 102, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(218, 10, 74, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(219, 10, 86, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(220, 10, 70, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(221, 10, 66, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(222, 10, 78, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(223, 10, 82, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(224, 10, 62, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(225, 10, 88, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(226, 10, 72, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(227, 10, 68, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(228, 10, 75, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(229, 10, 87, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(230, 10, 71, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(231, 10, 67, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(232, 10, 83, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(233, 10, 63, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(234, 10, 80, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(235, 10, 73, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(236, 10, 85, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(237, 10, 69, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(238, 10, 65, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(239, 10, 77, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(240, 10, 81, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(241, 10, 98, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(242, 10, 61, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(243, 11, 79, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(244, 11, 74, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(245, 11, 86, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(246, 11, 66, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(247, 11, 78, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(248, 11, 75, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(249, 11, 87, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(250, 11, 67, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(251, 11, 73, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(252, 11, 85, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(253, 11, 69, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(254, 11, 65, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(255, 11, 77, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(256, 11, 81, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(257, 11, 61, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(258, 12, 79, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(259, 12, 73, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(260, 12, 65, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(261, 12, 77, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(262, 12, 81, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(263, 13, 78, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(264, 13, 77, '2026-04-18 02:24:36', '2026-04-18 02:24:36'),
(265, 14, 107, '2026-04-18 02:26:19', '2026-04-18 02:26:19'),
(266, 14, 108, '2026-04-18 02:26:19', '2026-04-18 02:26:19'),
(267, 14, 109, '2026-04-18 02:26:19', '2026-04-18 02:26:19'),
(268, 14, 110, '2026-04-18 02:26:19', '2026-04-18 02:26:19'),
(269, 14, 111, '2026-04-18 02:26:19', '2026-04-18 02:26:19'),
(270, 14, 112, '2026-04-18 02:26:19', '2026-04-18 02:26:19'),
(271, 14, 113, '2026-04-18 02:26:19', '2026-04-18 02:26:19'),
(272, 14, 114, '2026-04-18 02:26:19', '2026-04-18 02:26:19'),
(273, 14, 115, '2026-04-18 02:26:19', '2026-04-18 02:26:19');

-- --------------------------------------------------------

--
-- Table structure for table `routes`
--

CREATE TABLE `routes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `origin` varchar(255) NOT NULL,
  `destination` varchar(255) NOT NULL,
  `distance_km` decimal(8,2) NOT NULL,
  `estimated_duration_hours` decimal(4,2) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `route_type` enum('local','inter_city','highway') NOT NULL,
  `toll_charges` decimal(10,2) NOT NULL DEFAULT 0.00,
  `fuel_estimate_liters` decimal(8,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `waypoints` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`waypoints`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `routes`
--

INSERT INTO `routes` (`id`, `name`, `origin`, `destination`, `distance_km`, `estimated_duration_hours`, `status`, `route_type`, `toll_charges`, `fuel_estimate_liters`, `description`, `waypoints`, `created_at`, `updated_at`) VALUES
(1, 'Ratnapura - Colombo', '', '', '0.00', '0.00', 'active', 'local', '0.00', '0.00', NULL, NULL, '2026-04-19 02:46:13', '2026-04-19 02:46:13');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('S6tKHVCSjqNYTCpy7tzIUL8KOae4GM85yNMqpYYq', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8115', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoibElTWnZWU1BUVVkzd3NPenBDS24zOXZvdTVtQWYxMFhGSFZIZ0lyUiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776830315);

-- --------------------------------------------------------

--
-- Table structure for table `stock_transfers`
--

CREATE TABLE `stock_transfers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transfer_reference` varchar(255) DEFAULT NULL,
  `inventory_item_id` bigint(20) UNSIGNED NOT NULL,
  `outlet_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `notes` text DEFAULT NULL,
  `transferred_by` bigint(20) UNSIGNED DEFAULT NULL,
  `transferred_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `outstanding_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `name`, `contact_person`, `email`, `phone`, `address`, `company`, `status`, `outstanding_balance`, `created_at`, `updated_at`) VALUES
(1, 'Dammika Prabhath', '0712323223', 'dammika@gmail.com', '0715656776', 'Eheliyagoda', 'ASD', 'active', '0.00', '2026-04-18 04:58:41', '2026-04-18 04:58:41'),
(2, 'Akalanka Imesh', '0789090009', 'akale@gmail.com', '0712323332', 'Eheliyagoda', 'Akale CORP', 'active', '0.00', '2026-04-18 04:59:25', '2026-04-18 22:58:20'),
(3, 'Pabasara Sweets', 'Pabasara', 'pabasaarexs@gmail.com', '0712323889', NULL, 'Pabasara Sweets', 'active', '0.00', '2026-04-21 02:38:50', '2026-04-21 02:38:50');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `key` varchar(255) NOT NULL,
  `value` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES
(1, 'system_enabled', '1', '2026-04-18 01:57:54', '2026-04-18 01:57:54');

-- --------------------------------------------------------

--
-- Table structure for table `test`
--

CREATE TABLE `test` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'employee',
  `employee_id` bigint(20) UNSIGNED DEFAULT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `role`, `employee_id`, `branch_id`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Super Admin', 'admin@gmail.com', NULL, '$2y$12$w1/nh3vD54bLnw.UDOdNOeInSN3iqKzRrs2RO7tTQZ3IQXJqFug4a', 'employee', NULL, NULL, NULL, '2026-04-18 01:56:41', '2026-04-18 01:56:41'),
(2, 'Pabasara Ranathunga', 'pabasararana@gmail.com', NULL, '$2y$12$s/O/9jUHuoaKI940hkaZd.LNeMI6fr2STkYKApS/gmwTyIvk4YXby', 'Admin/Owner', 2, 2, NULL, '2026-04-18 03:52:30', '2026-04-18 03:52:30'),
(3, 'Rangana Sampath', 'rangana@gmail.com', NULL, '$2y$12$PHOIFqnVRoCu3xzsqXggK.fwGhFxJnul.Nyh9pkPxCy5VYoXUwFRu', 'Sales Person', 3, 2, NULL, '2026-04-18 03:56:13', '2026-04-18 03:56:13'),
(4, 'Saman Sanjeewa', 'saman@gmail.com', NULL, '$2y$12$FRN6ayuChnZ3aICphm1lY.8OYs/bms.DSybVO0cf8FSSBdWr/IOAa', 'Driver', 4, 2, NULL, '2026-04-18 03:58:20', '2026-04-18 03:58:20');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `assigned_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`id`, `user_id`, `role_id`, `assigned_at`, `assigned_by`, `created_at`, `updated_at`) VALUES
(1, 2, 2, '2026-04-18 03:52:30', 1, NULL, NULL),
(2, 3, 9, '2026-04-18 03:56:13', 1, NULL, NULL),
(3, 4, 15, '2026-04-18 03:58:20', 1, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `registration_number` varchar(255) NOT NULL,
  `type` enum('truck','van','pickup','lorry') NOT NULL,
  `capacity_kg` decimal(10,2) NOT NULL,
  `status` enum('active','maintenance','inactive') NOT NULL DEFAULT 'active',
  `fuel_type` enum('diesel','petrol','electric') NOT NULL,
  `model` varchar(255) NOT NULL,
  `year` year(4) NOT NULL,
  `insurance_expiry` date NOT NULL,
  `license_expiry` date NOT NULL,
  `current_location` varchar(255) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `registration_number`, `type`, `capacity_kg`, `status`, `fuel_type`, `model`, `year`, `insurance_expiry`, `license_expiry`, `current_location`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'PB-9099', 'truck', '5000.00', 'active', 'diesel', 'Mazda Titan', 2007, '2026-06-19', '2026-06-17', 'Ratnapura Factory', NULL, '2026-04-19 02:47:23', '2026-04-19 02:47:23');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `attendance_employee_id_date_unique` (`employee_id`,`date`),
  ADD KEY `attendance_tenant_id_foreign` (`tenant_id`),
  ADD KEY `attendance_branch_id_foreign` (`branch_id`);

--
-- Indexes for table `bom_headers`
--
ALTER TABLE `bom_headers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `bom_headers_product_id_version_unique` (`product_id`,`version`);

--
-- Indexes for table `bom_items`
--
ALTER TABLE `bom_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `bom_items_bom_id_material_id_unique` (`bom_id`,`material_id`),
  ADD KEY `bom_items_material_id_foreign` (`material_id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `candidates`
--
ALTER TABLE `candidates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `candidates_candidate_code_unique` (`candidate_code`),
  ADD UNIQUE KEY `candidates_email_unique` (`email`),
  ADD KEY `candidates_tenant_id_foreign` (`tenant_id`),
  ADD KEY `candidates_branch_id_foreign` (`branch_id`);

--
-- Indexes for table `candidate_documents`
--
ALTER TABLE `candidate_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `candidate_documents_candidate_id_foreign` (`candidate_id`),
  ADD KEY `candidate_documents_type_index` (`type`);

--
-- Indexes for table `candidate_educations`
--
ALTER TABLE `candidate_educations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `candidate_educations_candidate_id_foreign` (`candidate_id`);

--
-- Indexes for table `candidate_experiences`
--
ALTER TABLE `candidate_experiences`
  ADD PRIMARY KEY (`id`),
  ADD KEY `candidate_experiences_candidate_id_foreign` (`candidate_id`);

--
-- Indexes for table `candidate_interviewers`
--
ALTER TABLE `candidate_interviewers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `candidate_interviewers_candidate_id_employee_id_unique` (`candidate_id`,`employee_id`),
  ADD KEY `candidate_interviewers_employee_id_foreign` (`employee_id`);

--
-- Indexes for table `candidate_interviews`
--
ALTER TABLE `candidate_interviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `candidate_interviews_candidate_id_foreign` (`candidate_id`);

--
-- Indexes for table `candidate_interview_participants`
--
ALTER TABLE `candidate_interview_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cip_interview_employee_unique` (`candidate_interview_id`,`employee_id`),
  ADD KEY `cip_employee_fk` (`employee_id`);

--
-- Indexes for table `cheque_registry_entries`
--
ALTER TABLE `cheque_registry_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cheque_registry_entries_company_id_foreign` (`company_id`),
  ADD KEY `cheque_registry_entries_company_cheque_account_id_foreign` (`company_cheque_account_id`),
  ADD KEY `cheque_registry_entries_distribution_payment_id_foreign` (`distribution_payment_id`),
  ADD KEY `cheque_registry_entries_direction_lifecycle_status_index` (`direction`,`lifecycle_status`),
  ADD KEY `cheque_registry_entries_source_module_index` (`source_module`),
  ADD KEY `cheque_registry_entries_cheque_no_index` (`cheque_no`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `companies_email_unique` (`email`);

--
-- Indexes for table `company_bank_accounts`
--
ALTER TABLE `company_bank_accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_bank_accounts_company_id_foreign` (`company_id`);

--
-- Indexes for table `company_cheque_accounts`
--
ALTER TABLE `company_cheque_accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_cheque_accounts_company_id_foreign` (`company_id`);

--
-- Indexes for table `delivery_cash_transactions`
--
ALTER TABLE `delivery_cash_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `delivery_cash_transactions_created_by_foreign` (`created_by`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `departments_tenant_id_name_unique` (`tenant_id`,`name`),
  ADD KEY `departments_branch_id_foreign` (`branch_id`);

--
-- Indexes for table `designations`
--
ALTER TABLE `designations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `designations_tenant_id_name_unique` (`tenant_id`,`name`),
  ADD KEY `designations_branch_id_foreign` (`branch_id`);

--
-- Indexes for table `distribution_customers`
--
ALTER TABLE `distribution_customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `distribution_customers_customer_code_unique` (`customer_code`),
  ADD KEY `distribution_customers_route_id_foreign` (`route_id`);

--
-- Indexes for table `distribution_invoices`
--
ALTER TABLE `distribution_invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `distribution_invoices_invoice_number_unique` (`invoice_number`),
  ADD KEY `distribution_invoices_customer_id_foreign` (`customer_id`),
  ADD KEY `distribution_invoices_load_id_foreign` (`load_id`);

--
-- Indexes for table `distribution_invoice_items`
--
ALTER TABLE `distribution_invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `distribution_invoice_items_distribution_invoice_id_foreign` (`distribution_invoice_id`),
  ADD KEY `distribution_invoice_items_inventory_item_id_foreign` (`inventory_item_id`),
  ADD KEY `distribution_invoice_items_load_id_foreign` (`load_id`);

--
-- Indexes for table `distribution_payments`
--
ALTER TABLE `distribution_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `distribution_payments_payment_number_unique` (`payment_number`),
  ADD KEY `distribution_payments_distribution_invoice_id_foreign` (`distribution_invoice_id`),
  ADD KEY `distribution_payments_customer_id_foreign` (`customer_id`),
  ADD KEY `distribution_payments_load_id_foreign` (`load_id`);

--
-- Indexes for table `distribution_returns`
--
ALTER TABLE `distribution_returns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `distribution_returns_return_number_unique` (`return_number`),
  ADD KEY `distribution_returns_distribution_invoice_id_foreign` (`distribution_invoice_id`),
  ADD KEY `distribution_returns_customer_id_foreign` (`customer_id`),
  ADD KEY `distribution_returns_returned_inventory_item_id_foreign` (`returned_inventory_item_id`),
  ADD KEY `distribution_returns_exchange_inventory_item_id_foreign` (`exchange_inventory_item_id`),
  ADD KEY `distribution_returns_load_id_foreign` (`load_id`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employees_employee_code_unique` (`employee_code`),
  ADD UNIQUE KEY `employees_email_unique` (`email`),
  ADD UNIQUE KEY `employees_nic_passport_unique` (`nic_passport`),
  ADD KEY `employees_tenant_id_foreign` (`tenant_id`),
  ADD KEY `employees_branch_id_foreign` (`branch_id`),
  ADD KEY `employees_department_id_foreign` (`department_id`),
  ADD KEY `employees_designation_id_foreign` (`designation_id`);

--
-- Indexes for table `employee_allowances_deductions`
--
ALTER TABLE `employee_allowances_deductions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_allowances_deductions_employee_id_foreign` (`employee_id`);

--
-- Indexes for table `employee_documents`
--
ALTER TABLE `employee_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_documents_employee_id_foreign` (`employee_id`),
  ADD KEY `employee_documents_type_index` (`type`),
  ADD KEY `employee_documents_branch_id_foreign` (`branch_id`);

--
-- Indexes for table `employee_educations`
--
ALTER TABLE `employee_educations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_educations_employee_id_foreign` (`employee_id`),
  ADD KEY `employee_educations_branch_id_foreign` (`branch_id`);

--
-- Indexes for table `employee_experiences`
--
ALTER TABLE `employee_experiences`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_experiences_employee_id_foreign` (`employee_id`),
  ADD KEY `employee_experiences_branch_id_foreign` (`branch_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `goods_received_notes`
--
ALTER TABLE `goods_received_notes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `goods_received_notes_grn_number_unique` (`grn_number`),
  ADD KEY `goods_received_notes_purchase_order_id_foreign` (`purchase_order_id`);

--
-- Indexes for table `grn_items`
--
ALTER TABLE `grn_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `grn_items_grn_id_foreign` (`grn_id`),
  ADD KEY `grn_items_purchase_order_item_id_foreign` (`purchase_order_item_id`);

--
-- Indexes for table `inventory_items`
--
ALTER TABLE `inventory_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `inventory_items_code_unique` (`code`),
  ADD KEY `inventory_items_supplier_id_foreign` (`supplier_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `leaves`
--
ALTER TABLE `leaves`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leaves_tenant_id_foreign` (`tenant_id`),
  ADD KEY `leaves_branch_id_foreign` (`branch_id`),
  ADD KEY `leaves_employee_id_foreign` (`employee_id`),
  ADD KEY `leaves_approved_by_foreign` (`approved_by`),
  ADD KEY `leaves_section_head_approved_by_foreign` (`section_head_approved_by`),
  ADD KEY `leaves_hr_approved_by_foreign` (`hr_approved_by`);

--
-- Indexes for table `leave_types`
--
ALTER TABLE `leave_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `leave_types_code_unique` (`code`);

--
-- Indexes for table `loads`
--
ALTER TABLE `loads`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `loads_load_number_unique` (`load_number`),
  ADD KEY `loads_vehicle_id_foreign` (`vehicle_id`),
  ADD KEY `loads_driver_id_foreign` (`driver_id`),
  ADD KEY `loads_route_id_foreign` (`route_id`),
  ADD KEY `loads_sales_ref_id_foreign` (`sales_ref_id`);

--
-- Indexes for table `load_expenses`
--
ALTER TABLE `load_expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `load_expenses_load_id_foreign` (`load_id`),
  ADD KEY `load_expenses_delivery_cash_transaction_id_foreign` (`delivery_cash_transaction_id`),
  ADD KEY `load_expenses_created_by_foreign` (`created_by`);

--
-- Indexes for table `load_items`
--
ALTER TABLE `load_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `load_items_load_id_type_index` (`load_id`,`type`),
  ADD KEY `load_items_product_code_index` (`product_code`);

--
-- Indexes for table `main_cash_transactions`
--
ALTER TABLE `main_cash_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `main_cash_transactions_created_by_foreign` (`created_by`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `outlets`
--
ALTER TABLE `outlets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `outlets_code_unique` (`code`),
  ADD KEY `outlets_user_id_foreign` (`user_id`);

--
-- Indexes for table `outlet_cash_drawers`
--
ALTER TABLE `outlet_cash_drawers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `outlet_cash_drawers_outlet_id_unique` (`outlet_id`),
  ADD KEY `outlet_cash_drawers_last_set_by_foreign` (`last_set_by`),
  ADD KEY `outlet_cash_drawers_last_set_at_index` (`last_set_at`);

--
-- Indexes for table `outlet_cash_drawer_sessions`
--
ALTER TABLE `outlet_cash_drawer_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `outlet_cash_drawer_sessions_outlet_id_session_date_unique` (`outlet_id`,`session_date`),
  ADD KEY `outlet_cash_drawer_sessions_opened_by_foreign` (`opened_by`),
  ADD KEY `outlet_cash_drawer_sessions_closed_by_foreign` (`closed_by`),
  ADD KEY `outlet_cash_drawer_sessions_outlet_id_status_index` (`outlet_id`,`status`);

--
-- Indexes for table `outlet_loyalty_customers`
--
ALTER TABLE `outlet_loyalty_customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `outlet_loyalty_customers_outlet_id_customer_code_unique` (`outlet_id`,`customer_code`),
  ADD UNIQUE KEY `outlet_loyalty_customers_outlet_id_phone_unique` (`outlet_id`,`phone`),
  ADD KEY `outlet_loyalty_customers_created_by_foreign` (`created_by`),
  ADD KEY `outlet_loyalty_customers_outlet_id_status_index` (`outlet_id`,`status`);

--
-- Indexes for table `outlet_sales`
--
ALTER TABLE `outlet_sales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `outlet_sales_sale_number_unique` (`sale_number`),
  ADD KEY `outlet_sales_sold_by_foreign` (`sold_by`),
  ADD KEY `outlet_sales_outlet_id_sale_date_index` (`outlet_id`,`sale_date`),
  ADD KEY `outlet_sales_loyalty_customer_id_foreign` (`loyalty_customer_id`);

--
-- Indexes for table `outlet_sale_items`
--
ALTER TABLE `outlet_sale_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `outlet_sale_items_inventory_item_id_foreign` (`inventory_item_id`),
  ADD KEY `outlet_sale_items_outlet_sale_id_inventory_item_id_index` (`outlet_sale_id`,`inventory_item_id`);

--
-- Indexes for table `packaging_batches`
--
ALTER TABLE `packaging_batches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `packaging_batches_label_code_unique` (`label_code`),
  ADD KEY `packaging_batches_qc_inspection_id_foreign` (`qc_inspection_id`),
  ADD KEY `packaging_batches_production_order_id_foreign` (`production_order_id`),
  ADD KEY `packaging_batches_status_packed_at_index` (`status`,`packed_at`),
  ADD KEY `packaging_batches_main_store_synced_at_index` (`main_store_synced_at`),
  ADD KEY `packaging_batches_batch_no_index` (`batch_no`),
  ADD KEY `packaging_batches_expiry_date_index` (`expiry_date`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `payrolls`
--
ALTER TABLE `payrolls`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payrolls_employee_id_month_year_unique` (`employee_id`,`month_year`),
  ADD KEY `payrolls_tenant_id_foreign` (`tenant_id`),
  ADD KEY `payrolls_branch_id_foreign` (`branch_id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_name_unique` (`name`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `petty_cash_transactions`
--
ALTER TABLE `petty_cash_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `petty_cash_transactions_created_by_foreign` (`created_by`);

--
-- Indexes for table `production_orders`
--
ALTER TABLE `production_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `production_orders_product_id_foreign` (`product_id`),
  ADD KEY `production_orders_bom_id_foreign` (`bom_id`),
  ADD KEY `production_orders_production_plan_id_foreign` (`production_plan_id`),
  ADD KEY `production_orders_batch_no_index` (`batch_no`);

--
-- Indexes for table `production_plans`
--
ALTER TABLE `production_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `production_plans_product_id_foreign` (`product_id`),
  ADD KEY `production_plans_bom_id_foreign` (`bom_id`),
  ADD KEY `production_plans_created_by_foreign` (`created_by`),
  ADD KEY `production_plans_plan_date_status_index` (`plan_date`,`status`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `products_code_unique` (`code`);

--
-- Indexes for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `purchase_orders_order_number_unique` (`order_number`),
  ADD KEY `purchase_orders_supplier_id_foreign` (`supplier_id`);

--
-- Indexes for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_order_items_purchase_order_id_foreign` (`purchase_order_id`),
  ADD KEY `purchase_order_items_inventory_item_id_foreign` (`inventory_item_id`);

--
-- Indexes for table `qc_inspections`
--
ALTER TABLE `qc_inspections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `qc_inspections_production_order_id_foreign` (`production_order_id`),
  ADD KEY `qc_inspections_inspection_date_quality_status_index` (`inspection_date`,`quality_status`);

--
-- Indexes for table `raw_materials`
--
ALTER TABLE `raw_materials`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `raw_materials_inventory_item_id_unique` (`inventory_item_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_unique` (`name`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_permissions_role_id_permission_id_unique` (`role_id`,`permission_id`),
  ADD KEY `role_permissions_permission_id_foreign` (`permission_id`);

--
-- Indexes for table `routes`
--
ALTER TABLE `routes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `stock_transfers`
--
ALTER TABLE `stock_transfers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_transfers_inventory_item_id_foreign` (`inventory_item_id`),
  ADD KEY `stock_transfers_outlet_id_foreign` (`outlet_id`),
  ADD KEY `stock_transfers_transferred_by_foreign` (`transferred_by`),
  ADD KEY `stock_transfers_transfer_reference_index` (`transfer_reference`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `system_settings_key_unique` (`key`);

--
-- Indexes for table `test`
--
ALTER TABLE `test`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_employee_id_foreign` (`employee_id`),
  ADD KEY `users_branch_id_foreign` (`branch_id`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_roles_user_id_role_id_unique` (`user_id`,`role_id`),
  ADD KEY `user_roles_role_id_foreign` (`role_id`),
  ADD KEY `user_roles_assigned_by_foreign` (`assigned_by`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `vehicles_registration_number_unique` (`registration_number`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bom_headers`
--
ALTER TABLE `bom_headers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `bom_items`
--
ALTER TABLE `bom_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `candidates`
--
ALTER TABLE `candidates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `candidate_documents`
--
ALTER TABLE `candidate_documents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `candidate_educations`
--
ALTER TABLE `candidate_educations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `candidate_experiences`
--
ALTER TABLE `candidate_experiences`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `candidate_interviewers`
--
ALTER TABLE `candidate_interviewers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `candidate_interviews`
--
ALTER TABLE `candidate_interviews`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `candidate_interview_participants`
--
ALTER TABLE `candidate_interview_participants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cheque_registry_entries`
--
ALTER TABLE `cheque_registry_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `company_bank_accounts`
--
ALTER TABLE `company_bank_accounts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `company_cheque_accounts`
--
ALTER TABLE `company_cheque_accounts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `delivery_cash_transactions`
--
ALTER TABLE `delivery_cash_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `designations`
--
ALTER TABLE `designations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `distribution_customers`
--
ALTER TABLE `distribution_customers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `distribution_invoices`
--
ALTER TABLE `distribution_invoices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `distribution_invoice_items`
--
ALTER TABLE `distribution_invoice_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `distribution_payments`
--
ALTER TABLE `distribution_payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `distribution_returns`
--
ALTER TABLE `distribution_returns`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `employee_allowances_deductions`
--
ALTER TABLE `employee_allowances_deductions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_documents`
--
ALTER TABLE `employee_documents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_educations`
--
ALTER TABLE `employee_educations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_experiences`
--
ALTER TABLE `employee_experiences`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `goods_received_notes`
--
ALTER TABLE `goods_received_notes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `grn_items`
--
ALTER TABLE `grn_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `inventory_items`
--
ALTER TABLE `inventory_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leaves`
--
ALTER TABLE `leaves`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leave_types`
--
ALTER TABLE `leave_types`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `loads`
--
ALTER TABLE `loads`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `load_expenses`
--
ALTER TABLE `load_expenses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `load_items`
--
ALTER TABLE `load_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `main_cash_transactions`
--
ALTER TABLE `main_cash_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `outlets`
--
ALTER TABLE `outlets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `outlet_cash_drawers`
--
ALTER TABLE `outlet_cash_drawers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `outlet_cash_drawer_sessions`
--
ALTER TABLE `outlet_cash_drawer_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `outlet_loyalty_customers`
--
ALTER TABLE `outlet_loyalty_customers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `outlet_sales`
--
ALTER TABLE `outlet_sales`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `outlet_sale_items`
--
ALTER TABLE `outlet_sale_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `packaging_batches`
--
ALTER TABLE `packaging_batches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `payrolls`
--
ALTER TABLE `payrolls`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=116;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `petty_cash_transactions`
--
ALTER TABLE `petty_cash_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `production_orders`
--
ALTER TABLE `production_orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `production_plans`
--
ALTER TABLE `production_plans`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `qc_inspections`
--
ALTER TABLE `qc_inspections`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `raw_materials`
--
ALTER TABLE `raw_materials`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=274;

--
-- AUTO_INCREMENT for table `routes`
--
ALTER TABLE `routes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `stock_transfers`
--
ALTER TABLE `stock_transfers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `test`
--
ALTER TABLE `test`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_roles`
--
ALTER TABLE `user_roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `attendance_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `attendance_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `bom_headers`
--
ALTER TABLE `bom_headers`
  ADD CONSTRAINT `bom_headers_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bom_items`
--
ALTER TABLE `bom_items`
  ADD CONSTRAINT `bom_items_bom_id_foreign` FOREIGN KEY (`bom_id`) REFERENCES `bom_headers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bom_items_material_id_foreign` FOREIGN KEY (`material_id`) REFERENCES `raw_materials` (`id`);

--
-- Constraints for table `candidates`
--
ALTER TABLE `candidates`
  ADD CONSTRAINT `candidates_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `candidates_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `candidate_documents`
--
ALTER TABLE `candidate_documents`
  ADD CONSTRAINT `candidate_documents_candidate_id_foreign` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `candidate_educations`
--
ALTER TABLE `candidate_educations`
  ADD CONSTRAINT `candidate_educations_candidate_id_foreign` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `candidate_experiences`
--
ALTER TABLE `candidate_experiences`
  ADD CONSTRAINT `candidate_experiences_candidate_id_foreign` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `candidate_interviewers`
--
ALTER TABLE `candidate_interviewers`
  ADD CONSTRAINT `candidate_interviewers_candidate_id_foreign` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `candidate_interviewers_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `candidate_interviews`
--
ALTER TABLE `candidate_interviews`
  ADD CONSTRAINT `candidate_interviews_candidate_id_foreign` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `candidate_interview_participants`
--
ALTER TABLE `candidate_interview_participants`
  ADD CONSTRAINT `cip_employee_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cip_interview_fk` FOREIGN KEY (`candidate_interview_id`) REFERENCES `candidate_interviews` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cheque_registry_entries`
--
ALTER TABLE `cheque_registry_entries`
  ADD CONSTRAINT `cheque_registry_entries_company_cheque_account_id_foreign` FOREIGN KEY (`company_cheque_account_id`) REFERENCES `company_cheque_accounts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `cheque_registry_entries_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `cheque_registry_entries_distribution_payment_id_foreign` FOREIGN KEY (`distribution_payment_id`) REFERENCES `distribution_payments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `company_bank_accounts`
--
ALTER TABLE `company_bank_accounts`
  ADD CONSTRAINT `company_bank_accounts_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `company_cheque_accounts`
--
ALTER TABLE `company_cheque_accounts`
  ADD CONSTRAINT `company_cheque_accounts_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_cash_transactions`
--
ALTER TABLE `delivery_cash_transactions`
  ADD CONSTRAINT `delivery_cash_transactions_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `departments`
--
ALTER TABLE `departments`
  ADD CONSTRAINT `departments_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `departments_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `designations`
--
ALTER TABLE `designations`
  ADD CONSTRAINT `designations_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `designations_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `distribution_customers`
--
ALTER TABLE `distribution_customers`
  ADD CONSTRAINT `distribution_customers_route_id_foreign` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `distribution_invoices`
--
ALTER TABLE `distribution_invoices`
  ADD CONSTRAINT `distribution_invoices_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `distribution_customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `distribution_invoices_load_id_foreign` FOREIGN KEY (`load_id`) REFERENCES `loads` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `distribution_invoice_items`
--
ALTER TABLE `distribution_invoice_items`
  ADD CONSTRAINT `distribution_invoice_items_distribution_invoice_id_foreign` FOREIGN KEY (`distribution_invoice_id`) REFERENCES `distribution_invoices` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `distribution_invoice_items_inventory_item_id_foreign` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `distribution_invoice_items_load_id_foreign` FOREIGN KEY (`load_id`) REFERENCES `loads` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `distribution_payments`
--
ALTER TABLE `distribution_payments`
  ADD CONSTRAINT `distribution_payments_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `distribution_customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `distribution_payments_distribution_invoice_id_foreign` FOREIGN KEY (`distribution_invoice_id`) REFERENCES `distribution_invoices` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `distribution_payments_load_id_foreign` FOREIGN KEY (`load_id`) REFERENCES `loads` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `distribution_returns`
--
ALTER TABLE `distribution_returns`
  ADD CONSTRAINT `distribution_returns_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `distribution_customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `distribution_returns_distribution_invoice_id_foreign` FOREIGN KEY (`distribution_invoice_id`) REFERENCES `distribution_invoices` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `distribution_returns_exchange_inventory_item_id_foreign` FOREIGN KEY (`exchange_inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `distribution_returns_load_id_foreign` FOREIGN KEY (`load_id`) REFERENCES `loads` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `distribution_returns_returned_inventory_item_id_foreign` FOREIGN KEY (`returned_inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `employees_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `employees_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
  ADD CONSTRAINT `employees_designation_id_foreign` FOREIGN KEY (`designation_id`) REFERENCES `designations` (`id`),
  ADD CONSTRAINT `employees_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `employee_allowances_deductions`
--
ALTER TABLE `employee_allowances_deductions`
  ADD CONSTRAINT `employee_allowances_deductions_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employee_documents`
--
ALTER TABLE `employee_documents`
  ADD CONSTRAINT `employee_documents_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `employee_documents_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employee_educations`
--
ALTER TABLE `employee_educations`
  ADD CONSTRAINT `employee_educations_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `employee_educations_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employee_experiences`
--
ALTER TABLE `employee_experiences`
  ADD CONSTRAINT `employee_experiences_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `employee_experiences_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `goods_received_notes`
--
ALTER TABLE `goods_received_notes`
  ADD CONSTRAINT `goods_received_notes_purchase_order_id_foreign` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `grn_items`
--
ALTER TABLE `grn_items`
  ADD CONSTRAINT `grn_items_grn_id_foreign` FOREIGN KEY (`grn_id`) REFERENCES `goods_received_notes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `grn_items_purchase_order_item_id_foreign` FOREIGN KEY (`purchase_order_item_id`) REFERENCES `purchase_order_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `inventory_items`
--
ALTER TABLE `inventory_items`
  ADD CONSTRAINT `inventory_items_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `leaves`
--
ALTER TABLE `leaves`
  ADD CONSTRAINT `leaves_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `leaves_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `leaves_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `leaves_hr_approved_by_foreign` FOREIGN KEY (`hr_approved_by`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `leaves_section_head_approved_by_foreign` FOREIGN KEY (`section_head_approved_by`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `leaves_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `loads`
--
ALTER TABLE `loads`
  ADD CONSTRAINT `loads_driver_id_foreign` FOREIGN KEY (`driver_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `loads_route_id_foreign` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `loads_sales_ref_id_foreign` FOREIGN KEY (`sales_ref_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `loads_vehicle_id_foreign` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `load_expenses`
--
ALTER TABLE `load_expenses`
  ADD CONSTRAINT `load_expenses_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `load_expenses_delivery_cash_transaction_id_foreign` FOREIGN KEY (`delivery_cash_transaction_id`) REFERENCES `delivery_cash_transactions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `load_expenses_load_id_foreign` FOREIGN KEY (`load_id`) REFERENCES `loads` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `load_items`
--
ALTER TABLE `load_items`
  ADD CONSTRAINT `load_items_load_id_foreign` FOREIGN KEY (`load_id`) REFERENCES `loads` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `main_cash_transactions`
--
ALTER TABLE `main_cash_transactions`
  ADD CONSTRAINT `main_cash_transactions_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `outlets`
--
ALTER TABLE `outlets`
  ADD CONSTRAINT `outlets_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `outlet_cash_drawers`
--
ALTER TABLE `outlet_cash_drawers`
  ADD CONSTRAINT `outlet_cash_drawers_last_set_by_foreign` FOREIGN KEY (`last_set_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `outlet_cash_drawers_outlet_id_foreign` FOREIGN KEY (`outlet_id`) REFERENCES `outlets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `outlet_cash_drawer_sessions`
--
ALTER TABLE `outlet_cash_drawer_sessions`
  ADD CONSTRAINT `outlet_cash_drawer_sessions_closed_by_foreign` FOREIGN KEY (`closed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `outlet_cash_drawer_sessions_opened_by_foreign` FOREIGN KEY (`opened_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `outlet_cash_drawer_sessions_outlet_id_foreign` FOREIGN KEY (`outlet_id`) REFERENCES `outlets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `outlet_loyalty_customers`
--
ALTER TABLE `outlet_loyalty_customers`
  ADD CONSTRAINT `outlet_loyalty_customers_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `outlet_loyalty_customers_outlet_id_foreign` FOREIGN KEY (`outlet_id`) REFERENCES `outlets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `outlet_sales`
--
ALTER TABLE `outlet_sales`
  ADD CONSTRAINT `outlet_sales_loyalty_customer_id_foreign` FOREIGN KEY (`loyalty_customer_id`) REFERENCES `outlet_loyalty_customers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `outlet_sales_outlet_id_foreign` FOREIGN KEY (`outlet_id`) REFERENCES `outlets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `outlet_sales_sold_by_foreign` FOREIGN KEY (`sold_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `outlet_sale_items`
--
ALTER TABLE `outlet_sale_items`
  ADD CONSTRAINT `outlet_sale_items_inventory_item_id_foreign` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `outlet_sale_items_outlet_sale_id_foreign` FOREIGN KEY (`outlet_sale_id`) REFERENCES `outlet_sales` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `packaging_batches`
--
ALTER TABLE `packaging_batches`
  ADD CONSTRAINT `packaging_batches_production_order_id_foreign` FOREIGN KEY (`production_order_id`) REFERENCES `production_orders` (`id`),
  ADD CONSTRAINT `packaging_batches_qc_inspection_id_foreign` FOREIGN KEY (`qc_inspection_id`) REFERENCES `qc_inspections` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payrolls`
--
ALTER TABLE `payrolls`
  ADD CONSTRAINT `payrolls_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `payrolls_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `payrolls_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `petty_cash_transactions`
--
ALTER TABLE `petty_cash_transactions`
  ADD CONSTRAINT `petty_cash_transactions_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `production_orders`
--
ALTER TABLE `production_orders`
  ADD CONSTRAINT `production_orders_bom_id_foreign` FOREIGN KEY (`bom_id`) REFERENCES `bom_headers` (`id`),
  ADD CONSTRAINT `production_orders_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `production_orders_production_plan_id_foreign` FOREIGN KEY (`production_plan_id`) REFERENCES `production_plans` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `production_plans`
--
ALTER TABLE `production_plans`
  ADD CONSTRAINT `production_plans_bom_id_foreign` FOREIGN KEY (`bom_id`) REFERENCES `bom_headers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `production_plans_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `production_plans_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD CONSTRAINT `purchase_orders_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD CONSTRAINT `purchase_order_items_inventory_item_id_foreign` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_order_items_purchase_order_id_foreign` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `qc_inspections`
--
ALTER TABLE `qc_inspections`
  ADD CONSTRAINT `qc_inspections_production_order_id_foreign` FOREIGN KEY (`production_order_id`) REFERENCES `production_orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `raw_materials`
--
ALTER TABLE `raw_materials`
  ADD CONSTRAINT `raw_materials_inventory_item_id_foreign` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stock_transfers`
--
ALTER TABLE `stock_transfers`
  ADD CONSTRAINT `stock_transfers_inventory_item_id_foreign` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_transfers_outlet_id_foreign` FOREIGN KEY (`outlet_id`) REFERENCES `outlets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_transfers_transferred_by_foreign` FOREIGN KEY (`transferred_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `users_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`);

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_assigned_by_foreign` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_roles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
