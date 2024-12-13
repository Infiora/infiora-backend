import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { isProductOwner, isProfileOwner } from '../../modules/middleware';
import { productController, productValidation } from '../../modules/product';
import { multerUpload } from '../../modules/utils';

const router: Router = express.Router();

router
  .route('/')
  .post(auth(), validate(productValidation.createProduct), multerUpload.single('image'), productController.createProduct)
  .get(validate(productValidation.getProducts), productController.getProducts);

router
  .route('/reorder/:profileId')
  .patch(auth(), validate(productValidation.reorderProducts), isProfileOwner, productController.reorderProducts);

router
  .route('/:productId')
  .get(validate(productValidation.getProduct), productController.getProduct)
  .patch(
    auth(),
    validate(productValidation.updateProduct),
    isProductOwner,
    multerUpload.single('image'),
    productController.updateProduct
  )
  .delete(auth(), validate(productValidation.deleteProduct), isProductOwner, productController.deleteProduct);

export default router;
