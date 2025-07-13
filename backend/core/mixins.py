from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin


class ExtIdMixin(models.Model):
    ext_id = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_('Внешний ID'),
        help_text=_('Внешний идентификатор из внешней базы'),
        null=True,
        blank=True,
    )

    class Meta:
        abstract = True